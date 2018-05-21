import base64
import binascii
import hashlib
import logging
from datetime import datetime

import ecdsa
import requests
from pyasn1.codec.der.decoder import decode as der_decode
from pyasn1.codec.native.encoder import encode as python_encode
from pyasn1_modules import rfc5280
from requests_hawk import HawkAuth

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils import timezone
from django.utils.functional import cached_property


INFO_RECEIVED_SIGNATURES = 'normandy.autograph.I001'


logger = logging.getLogger(__name__)


class Autographer(object):
    """
    Interacts with an Autograph service.

    If Autograph signing is not configured using `settings.AUTOGRAPH`,
    raises `ImproperlyConfigured`. If the Autograph server can't be reached
    or returns an HTTP error, an error will be raised by `requests`.
    """

    def __init__(self):
        self.check_config()

    @cached_property
    def session(self):
        session = requests.Session()
        session.auth = HawkAuth(
            id=str(settings.AUTOGRAPH_HAWK_ID),
            key=str(settings.AUTOGRAPH_HAWK_SECRET_KEY))
        return session

    def check_config(self):
        required_keys = ['URL', 'HAWK_ID', 'HAWK_SECRET_KEY']
        for key in required_keys:
            if getattr(settings, 'AUTOGRAPH_' + key) is None:
                msg = 'set settings.AUTOGRAPH_{} to use action signatures'.format(key)
                raise ImproperlyConfigured(msg)

    def sign_data(self, content_list):
        """
        Fetches Signatures objects from Autograph for each item in `content_list`.

        The items in `content_list` must be bytes objects.
        """
        ts = timezone.now()
        url = '{}sign/data'.format(settings.AUTOGRAPH_URL)
        signing_request = []
        for item in content_list:
            # base64 works in bytes. requests work in UTF-8.
            # Convert to bytes, and then back.
            encoded_implementation = base64.b64encode(item).decode('utf8')
            signing_request.append({
                'input': encoded_implementation,
            })

        res = self.session.post(url, json=signing_request)
        res.raise_for_status()
        signing_responses = res.json()

        logger.info(
            f'Got {len(signing_responses)} signatures from Autograph',
            extra={'code': INFO_RECEIVED_SIGNATURES}
        )

        signatures = []
        for res in signing_responses:

            signatures.append({
                'timestamp': ts,
                'signature': res['signature'],
                'x5u': res.get('x5u'),
                'public_key': res['public_key'],
            })
        return signatures


def verify_signature(data, signature, pubkey):
    """
    Verify a signature.

    If the signature is valid, returns True. If the signature is invalid, raise
    an exception explaining why.
    """
    if isinstance(data, str):
        data = data.encode()

    # Add data template
    data = b'Content-Signature:\x00' + data

    try:
        verifying_pubkey = ecdsa.VerifyingKey.from_pem(pubkey)
    except binascii.Error as e:
        if e.args == ('Incorrect padding',):
            raise WrongPublicKeySize()
        else:
            raise
    except IndexError:
        raise WrongPublicKeySize()

    try:
        signature = base64.urlsafe_b64decode(signature)
    except binascii.Error as e:
        if e.args == ('Incorrect padding',):
            raise WrongSignatureSize()
        else:
            raise

    verified = False

    try:
        verified = verifying_pubkey.verify(signature, data, hashfunc=hashlib.sha384)
    except ecdsa.keys.BadSignatureError:
        raise SignatureDoesNotMatch()
    except AssertionError as e:
        # The signature verifier has a clause like
        #     assert len(signature) == 2*l, (len(signature), 2*l)
        # Check that the AssertionError is consistent with that
        if (len(e.args) == 1 and
                isinstance(e.args[0], tuple) and
                len(e.args[0]) == 2 and
                isinstance(e.args[0][0], int) and
                isinstance(e.args[0][1], int)):
            raise WrongSignatureSize()
        else:
            raise

    if not verified:
        raise BadSignature()

    return True


class BadSignature(Exception):
    detail = 'Unknown signature problem'


class SignatureDoesNotMatch(BadSignature):
    detail = 'Signature is correct, but not valid for this data'


class WrongSignatureSize(BadSignature):
    detail = 'Signature is not the right number of bytes'


class WrongPublicKeySize(BadSignature):
    detail = 'Public Key is not the right number of bytes'


def read_timestamp_object(obj):
    general_date_format = '%Y%m%d%H%M%SZ'
    utc_date_format = '%y%m%d%H%M%SZ'

    if 'generalTime' in obj:
        timestamp = obj['generalTime'].decode()
        return datetime.strptime(timestamp, general_date_format)
    elif 'utcTime' in obj:
        timestamp = obj['utcTime'].decode()
        return datetime.strptime(timestamp, utc_date_format)
    else:
        raise BadCertificate(
            'Timestamp not in expected format. '
            'Expected either "generalTime" or "utcTime", found keys {}'
            .format(str(list(obj.keys())))
        )


def verify_x5u(url, expire_early=None):
    """
    Verify the certificate chain at a URL.

    If the certificates are valid, return True. Otherwise, raise an
    exception explaining why they are not valid.
    """
    req = requests.get(url)
    req.raise_for_status()
    pem = req.content.decode()
    certs = parse_pem_to_certs(pem)

    for cert in certs:
        try:
            validity = cert['tbsCertificate']['validity']
            not_before = read_timestamp_object(validity['notBefore'])
            not_after = read_timestamp_object(validity['notAfter'])
        except KeyError as e:
            raise BadCertificate(f'Certificate does not have expected shape: KeyError {e}')
        check_validity(not_before, not_after, expire_early)

    return True


def check_validity(not_before, not_after, expire_early):
    """
    Check validity dates.

    If not_before is in the past, and not_after is in the future,
    return True, otherwise raise an Exception explaining the problem.

    If expire_early is passed, an exception will be raised if the
    not_after date is too soon in the future.
    """
    now = datetime.now()
    if not_before > not_after:
        raise BadCertificate(f'not_before ({not_before}) after not_after ({not_after})')
    if now < not_before:
        raise CertificateNotYetValid(not_before)
    if now > not_after:
        raise CertificateExpired(not_after)
    if expire_early:
        if now + expire_early > not_after:
            raise CertificateExpiringSoon(expire_early)
    return True


class BadCertificate(Exception):
    def __init__(self, extra):
        self.extra = extra

    @property
    def detail(self):
        return f'Bad certificate: {self.extra}'


class CertificateNotYetValid(BadCertificate):
    def __init__(self, not_before):
        self.not_before = not_before

    @property
    def detail(self):
        return f'Certificate is not valid until {self.not_before}'


class CertificateExpired(BadCertificate):
    def __init__(self, not_after):
        self.not_after = not_after

    @property
    def detail(self):
        return f'Certificate expired in the past on {self.not_after}'


class CertificateExpiringSoon(BadCertificate):
    def __init__(self, window):
        self.window = window

    @property
    def detail(self):
        return f'Certificate is expiring soon (in the next {self.window})'


class CertificateParseError(BadCertificate):
    def __init__(self, extra):
        self.extra = extra

    @property
    def detail(self):
        return f'Could not parse certificate: {self.extra}'


def parse_pem_to_certs(pem):
    """
    Convert PEM formatted certificates into DER format.

    :param pem: String containing a list of PEM encoded certificates
    :returns: List of Python objects representing certificates
    """
    certs_der = []
    acc = ''
    state = 'PRE'
    for line in pem.split('\n'):
        if state == 'PRE' and line == '-----BEGIN CERTIFICATE-----':
            state = 'BODY_OR_META'
        elif state == 'PRE' and not line:
            pass
        elif state == 'BODY_OR_META' and ':' in line:
            state = 'META'
        elif state == 'BODY' and line == '-----END CERTIFICATE-----':
            certs_der.append(base64.b64decode(acc))
            acc = ''
            state = 'PRE'
        elif state == 'META' and not line:
            state = 'BODY'
        elif state == 'BODY' or state == 'BODY_OR_META':
            acc += line
            state = 'BODY'
        else:
            raise CertificateParseError(f'Unexpected input "{line}" in state "{state}"')

    if acc:
        raise CertificateParseError(f'Unexpected end of input. Leftover: {acc}')

    certs_py = []
    for der in certs_der:
        cert, rest_of_input = der_decode(der, asn1Spec=rfc5280.Certificate())
        assert not rest_of_input  # assert no left over input
        certs_py.append(python_encode(cert))

    return certs_py
