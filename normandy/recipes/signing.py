import base64
import binascii
import hashlib
import logging
import re
from datetime import datetime

import pytz
import requests
import ecdsa.util
import fastecdsa.ecdsa
from fastecdsa.encoding.pem import PEMEncoder
from hashlib import sha256
from pyasn1.codec.der.decoder import decode as der_decode
from pyasn1_modules import rfc5280
from requests_hawk import HawkAuth

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils import timezone
from django.utils.functional import cached_property


INFO_RECEIVED_SIGNATURES = "normandy.autograph.I001"


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
            id=str(settings.AUTOGRAPH_HAWK_ID), key=str(settings.AUTOGRAPH_HAWK_SECRET_KEY)
        )
        return session

    def check_config(self):
        required_keys = ["URL", "HAWK_ID", "HAWK_SECRET_KEY"]
        for key in required_keys:
            if getattr(settings, "AUTOGRAPH_" + key) is None:
                msg = "set settings.AUTOGRAPH_{} to use action signatures".format(key)
                raise ImproperlyConfigured(msg)

    def sign_data(self, content_list):
        """
        Fetches Signatures objects from Autograph for each item in `content_list`.

        The items in `content_list` must be bytes objects.
        """
        ts = timezone.now()
        url = "{}sign/data".format(settings.AUTOGRAPH_URL)
        signing_request = []
        for item in content_list:
            # base64 works in bytes. requests work in UTF-8.
            # Convert to bytes, and then back.
            encoded_implementation = base64.b64encode(item).decode("utf8")
            signing_request.append({"input": encoded_implementation})

        res = self.session.post(url, json=signing_request)
        res.raise_for_status()
        signing_responses = res.json()

        logger.info(
            f"Got {len(signing_responses)} signatures from Autograph",
            extra={"code": INFO_RECEIVED_SIGNATURES},
        )

        signatures = []
        for res in signing_responses:
            logger.info(f"Autograph response: {res['ref']}")

            assert res["signature"], "Response from Autograph did not contain signature"
            assert res["x5u"], "Response from Autograph did not contain x5u"

            signatures.append({"timestamp": ts, "signature": res["signature"], "x5u": res["x5u"]})
        return signatures


BASE64_WRONG_LENGTH_RE = re.compile(
    r"Invalid base64-encoded string: number of data characters \(\d+\) cannot "
    r"be [123] more than a multiple of 4"
)


def verify_signature_pubkey(data, signature, pubkey):
    """
    Verify a signature.

    If the signature is valid, returns True. If the signature is invalid, raise
    an exception explaining why.
    """
    # Data must be encoded as bytes
    if isinstance(data, str):
        data = data.encode()

    # Content signature implicitly adds a prefix to signed data
    data = b"Content-Signature:\x00" + data

    # fastecdsa expects ASCII armored keys, but ours is unarmored. Add the
    # armor before passing the key to the library.
    EC_PUBLIC_HEADER = "-----BEGIN PUBLIC KEY-----"
    EC_PUBLIC_FOOTER = "-----END PUBLIC KEY-----"
    verifying_pubkey = PEMEncoder.decode_public_key(
        "\n".join([EC_PUBLIC_HEADER, pubkey, EC_PUBLIC_FOOTER])
    )

    try:
        signature = base64.urlsafe_b64decode(signature)
        signature = ecdsa.util.sigdecode_string(signature, order=ecdsa.curves.NIST384p.order)
    except binascii.Error as e:
        if BASE64_WRONG_LENGTH_RE.match(e.args[0]):
            raise WrongSignatureSize("Base64 encoded signature was not a multiple of 4")
        else:
            raise
    except AssertionError as e:
        # The signature decoder has a clause like
        #     assert len(signature) == 2*l, (len(signature), 2*l)
        # If the AssertionError is consistent with that signature, translate it
        # to a nicer error. Otherwise re-raise.
        if (
            len(e.args) == 1
            and isinstance(e.args[0], tuple)
            and len(e.args[0]) == 2
            and isinstance(e.args[0][0], int)
            and isinstance(e.args[0][1], int)
        ):
            raise WrongSignatureSize()
        else:
            raise

    verified = fastecdsa.ecdsa.verify(
        signature, data, verifying_pubkey, curve=fastecdsa.curve.P384, hashfunc=hashlib.sha384
    )

    if not verified:
        raise SignatureDoesNotMatch()

    return True


class BadSignature(Exception):
    detail = "Unknown signature problem"


class SignatureDoesNotMatch(BadSignature):
    detail = "Signature is correct, but not valid for this data"


class WrongSignatureSize(BadSignature):
    detail = "Signature is not the right number of bytes"


class WrongPublicKeySize(BadSignature):
    detail = "Public Key is not the right number of bytes"


def read_timestamp_object(obj):
    if "generalTime" in obj:
        return obj["generalTime"].asDateTime
    elif "utcTime" in obj:
        return obj["utcTime"].asDateTime
    else:
        raise BadCertificate(
            "Timestamp not in expected format. "
            'Expected either "generalTime" or "utcTime", found keys {}'.format(
                str(list(obj.keys()))
            )
        )


def verify_x5u(url, expire_early=None):
    """
    Verify the certificate chain at a URL.

    If the certificates are valid, return the end of the
    chain. Otherwise, raise an exception explaining why they are not
    valid.
    """
    req = requests.get(url)
    req.raise_for_status()
    pem = req.content.decode()

    der_encoded_certs = extract_certs_from_pem(pem)
    decoded_certs = [parse_cert_from_der(der) for der in der_encoded_certs]

    if settings.CERTIFICATES_CHECK_VALIDITY:
        for cert in decoded_certs:
            # Check that the certificate is currently valid, and optionally check
            # that it isn't expiring soon.
            try:
                validity = cert["tbsCertificate"]["validity"]
                not_before = read_timestamp_object(validity["notBefore"])
                not_after = read_timestamp_object(validity["notAfter"])
            except KeyError as e:
                raise BadCertificate(f"Certificate does not have expected shape: KeyError {e}")
            check_validity(not_before, not_after, expire_early)

    # If an root hash has been configured, check that the root certificate in
    # the chain matches the expected value.
    if settings.CERTIFICATES_EXPECTED_ROOT_HASH:
        root_fingerprint = sha256(der_encoded_certs[-1]).hexdigest().lower()
        expected = settings.CERTIFICATES_EXPECTED_ROOT_HASH.replace(":", "").lower()
        if root_fingerprint != expected:
            raise CertificateHasWrongRoot(expected=expected, actual=root_fingerprint)

    # If an expected subject common name is configured, check that the signing
    # certificate matches that expectation
    if settings.CERTIFICATES_EXPECTED_SUBJECT_CN:
        # Assume the first cert in the chain generated the signature
        signing_cert = decoded_certs[0]
        # Get the list of names (Including company name, common name, and country)
        names = signing_cert["tbsCertificate"]["subject"][0]
        # Find the common name within the list by filtering by the rfc-defined ID for it
        common_name_object = next(
            (name[0]["value"] for name in names if name[0]["type"] == rfc5280.id_at_commonName),
            None,
        )
        # Decode the bytes of the common name object as a Directory String
        common_name_string, rest = der_decode(
            common_name_object.asOctets(), asn1Spec=rfc5280.DirectoryString()
        )
        assert not rest  # Assert we processed the entire input
        # Get the first value from that Directory String (which might be one of
        # several formats), convert it to bytes, and then finally decode it
        # into a Python string.
        common_name = next(common_name_string.values()).asOctets().decode()

        expected = settings.CERTIFICATES_EXPECTED_SUBJECT_CN
        if common_name != expected:
            raise CertificateHasWrongSubject(expected=expected, actual=common_name)

    return decoded_certs[0]


def check_validity(not_before, not_after, expire_early):
    """
    Check validity dates.

    If not_before is in the past, and not_after is in the future,
    return True, otherwise raise an Exception explaining the problem.

    If expire_early is passed, an exception will be raised if the
    not_after date is too soon in the future.
    """
    now = datetime.utcnow().replace(tzinfo=pytz.utc)
    if not_before > not_after:
        raise BadCertificate(f"not_before ({not_before}) after not_after ({not_after})")
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
        return f"Bad certificate: {self.extra}"


class CertificateNotYetValid(BadCertificate):
    def __init__(self, not_before):
        self.not_before = not_before

    @property
    def detail(self):
        return f"Certificate is not valid until {self.not_before}"


class CertificateExpired(BadCertificate):
    def __init__(self, not_after):
        self.not_after = not_after

    @property
    def detail(self):
        return f"Certificate expired in the past on {self.not_after}"


class CertificateExpiringSoon(BadCertificate):
    def __init__(self, window):
        self.window = window

    @property
    def detail(self):
        return f"Certificate is expiring soon (in the next {self.window})"


class CertificateParseError(BadCertificate):
    def __init__(self, extra):
        self.extra = extra

    @property
    def detail(self):
        return f"Could not parse certificate: {self.extra}"


class CertificateHasWrongRoot(BadCertificate):
    def __init__(self, *, expected, actual):
        self.expected = expected
        self.actual = actual
        return

    @property
    def detail(self):
        return f"Certificate is not based on expected root hash. Got '{self.actual!r}' expected '{self.expected!r}'"


class CertificateHasWrongSubject(BadCertificate):
    def __init__(self, *, expected, actual):
        self.expected = expected
        self.actual = actual
        return

    @property
    def detail(self):
        return f"Certificate does not have the expected subject. Got {self.actual!r} expected {self.expected!r}"


def extract_certs_from_pem(pem):
    """
    Parse certificates out of a PEM file. Returns DER encoded strings.

    :param pem: String containing a list of PEM encoded certificates
    :returns: List of Python objects representing certificates
    """
    certs_der = []
    acc = ""
    state = "PRE"
    for line in pem.split("\n"):
        if state == "PRE" and line == "-----BEGIN CERTIFICATE-----":
            state = "BODY_OR_META"
        elif state == "PRE" and not line:
            pass
        elif state == "BODY_OR_META" and ":" in line:
            state = "META"
        elif state == "BODY" and line == "-----END CERTIFICATE-----":
            certs_der.append(base64.b64decode(acc))
            acc = ""
            state = "PRE"
        elif state == "META" and not line:
            state = "BODY"
        elif state == "BODY" or state == "BODY_OR_META":
            acc += line
            state = "BODY"
        else:
            raise CertificateParseError(f'Unexpected input "{line}" in state "{state}"')

    if acc:
        raise CertificateParseError(f"Unexpected end of input. Leftover: {acc}")

    return certs_der


def parse_cert_from_der(der):
    cert, rest_of_input = der_decode(der, asn1Spec=rfc5280.Certificate())
    assert not rest_of_input  # assert no left over input
    return cert
