import base64
import binascii
import hashlib
import logging

import ecdsa
import requests
from requests_hawk import HawkAuth

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils import timezone
from django.utils.functional import cached_property


INFO_RECEIVED_SIGNATURES = 'normandy.autograph.I001'


logger = logging.getLogger(__name__)


def fraction_to_key(frac):
    """Map from the range [0, 1] to [0, max(sha256)]. The result is a string."""
    # SHA 256 hashes are 64-digit hexadecimal numbers. The largest possible SHA 256
    # hash is 2^256 - 1

    if frac < 0 or frac > 1:
        raise ValueError('frac must be between 0 and 1 inclusive (got {})'.format(frac))

    mult = 2 ** 256 - 1
    in_decimal = int(frac * mult)

    assert in_decimal >= 0

    hex_digits = hex(in_decimal)[2:]  # Strip off leading "0x"
    padded = "{:0>64}".format(hex_digits)

    # Saturate at 2**256 - 1
    if len(padded) > 64:
        return 'f' * 64
    else:
        return padded


def deterministic_sample(rate, inputs):
    """
    Deterministically choose True or False based for a set of inputs.

    Internally, converts `rate` into a point in the sha256 hash space. If the
    hash of `inputs` is less than that point, it returns True.

    :param rate: The probability of returning True
    :param input: A list of hashable data to feed to decide True or False about
    :returns: True with probability `rate` and False otherwise
    """
    hasher = hashlib.sha256()
    for inp in inputs:
        hasher.update(str(inp).encode('utf8'))

    sample_point = fraction_to_key(rate)
    input_hash = hasher.hexdigest()

    assert len(sample_point) == 64
    assert len(input_hash) == 64

    return input_hash < sample_point


class Autographer(object):
    """
    Interacts with an Autograph service.

    If Autograph signing is not configured using `settings.AUTOGRAPH`,
    raises `ImproperlyConfigured`. If the Autograph server can't be reached
    or returns an HTTP error, an error will be thrown by `requests`.
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
                'template': 'content-signature',
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


verify_signature.BadSignature = BadSignature
verify_signature.SignatureDoesNotMatch = SignatureDoesNotMatch
verify_signature.WrongSignatureSize = WrongSignatureSize
verify_signature.WrongPublicKeySize = WrongPublicKeySize
