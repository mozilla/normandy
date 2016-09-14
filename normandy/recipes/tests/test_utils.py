import base64
from unittest.mock import MagicMock
from random import random
from fractions import Fraction

from django.core.exceptions import ImproperlyConfigured

import pytest

from normandy.recipes.utils import Autographer, fraction_to_key, verify_signature


class TestFractionToKey(object):
    def test_exact(self):
        assert fraction_to_key(Fraction(0, 4)) == '0' * 64
        assert fraction_to_key(Fraction(1, 4)) == '3' + 'f' * 63
        assert fraction_to_key(Fraction(2, 4)) == '7' + 'f' * 63
        assert fraction_to_key(Fraction(3, 4)) == 'b' + 'f' * 63
        assert fraction_to_key(Fraction(4, 4)) == 'f' * 64
        assert fraction_to_key(Fraction(1, 32)) == '07' + 'f' * 62

    def test_floats(self):
        assert fraction_to_key(0.0) == '0' * 64
        assert fraction_to_key(1.0) == 'f' * 64
        # This magic number is 0.00001 * 2**256, in hexadecimal
        assert (fraction_to_key(0.00001) ==
                '0000a7c5ac471b47880000000000000000000000000000000000000000000000')

    @pytest.mark.parametrize('bad_val', [-1, -0.5, 1.5, 2])
    def test_error_cases(self, bad_val):
        with pytest.raises(ValueError) as exc:
            fraction_to_key(bad_val)

        # Check that it is the expected error, not some spurious error from elsewhere.
        assert 'must be between 0 and 1 inclusive' in str(exc)
        # Check that the bad value is mentioned
        assert str(bad_val) in str(exc)

    def test_result_length(self):
        for _ in range(100):
            r = random()
            key = fraction_to_key(r)
            assert len(key) == 64


class TestAutographer(object):
    test_settings = {
        'URL': 'https://autograph.example.com/',
        'HAWK_ID': 'hawk id',
        'HAWK_SECRET_KEY': 'hawk secret key',
    }

    def test_it_checks_settings(self, settings):
        """Test that each required key is required individually"""
        # Leave out URL
        settings.AUTOGRAPH_URL = None
        settings.AUTOGRAPH_HAWK_ID = 'hawk id'
        settings.AUTOGRAPH_HAWK_SECRET_KEY = 'hawk secret key'
        with pytest.raises(ImproperlyConfigured) as exc:
            Autographer()
        assert 'AUTOGRAPH_URL' in str(exc)

        # Leave out HAWK_ID
        settings.AUTOGRAPH_URL = 'https://autograph.example.com'
        settings.AUTOGRAPH_HAWK_ID = None
        settings.AUTOGRAPH_HAWK_SECRET_KEY = 'hawk secret key'
        with pytest.raises(ImproperlyConfigured) as exc:
            Autographer()
        assert 'AUTOGRAPH_HAWK_ID' in str(exc)

        # Leave out HAWK_SECRET_KEY
        settings.AUTOGRAPH_URL = 'https://autograph.example.com'
        settings.AUTOGRAPH_HAWK_ID = 'hawk id'
        settings.AUTOGRAPH_HAWK_SECRET_KEY = None
        with pytest.raises(ImproperlyConfigured) as exc:
            Autographer()
        assert 'AUTOGRAPH_HAWK_SECRET_KEY' in str(exc)

        # Include everything
        settings.AUTOGRAPH_URL = 'https://autograph.example.com'
        settings.AUTOGRAPH_HAWK_ID = 'hawk id'
        settings.AUTOGRAPH_HAWK_SECRET_KEY = 'hawk secret key'
        # assert doesn't raise
        Autographer()

    def test_it_makes_good_requests(self, settings):
        settings.AUTOGRAPH_URL = 'https://autograph.example.com'
        settings.AUTOGRAPH_HAWK_ID = 'hawk id'
        settings.AUTOGRAPH_HAWK_SECRET_KEY = 'hawk secret key'

        autographer = Autographer()
        autographer.session = MagicMock()

        url = self.test_settings['URL'] + 'sign/data'
        foo_base64 = base64.b64encode(b'foo').decode('utf8')
        bar_base64 = base64.b64encode(b'bar').decode('utf8')

        autographer.sign_data([b'foo', b'bar'])
        assert autographer.session.post.called_once_with(
            [url, [
                {'template': 'content-signature', 'input': foo_base64},
                {'template': 'content-signature', 'input': bar_base64},
            ]]
        )


class TestVerifySignature(object):

    # known good data
    data = '{"action":"console-log","approval":null,"arguments":{"message":"telemetry available"},"current_approval_request":null,"enabled":true,"filter_expression":"telemetry != undefined","id":22,"is_approved":false,"last_updated":"2016-09-01T23:03:17.360536Z","name":"mythmon\'s system addon test","revision_id":2}'  # noqa
    signature = 'sSyFLu0fY7mcrMwueJlvV9JV7XCrBUyEJCx08awzhPhGcUXEO7gC0gA15GLMbkHEfC1ekOoK0WGhQwMZgEMbT_QOQf4BqquG8C1zsjOpUEf7d38D4nyFA7Ow7gPNzYLQ'  # noqa
    pubkey = 'MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEh+JqU60off8jnvWkQAnP/P4vdKjP0aFiK4rrDne5rsqNd4A4A/z5P2foRFltlS6skODDIUu4X/C2pwROMgSXpkRFZxXk9IwATCRCVQ7YnffR8f1Jw5fWzCerDmf5fAj5'  # noqa

    def test_known_good_signature(self):
        assert verify_signature(self.data, self.signature, self.pubkey)

    def test_raises_nice_error_for_too_short_signatures_bad_padding(self):
        signature = 'a_too_short_signature'

        with pytest.raises(verify_signature.WrongSignatureSize):
            verify_signature(self.data, signature, self.pubkey)

    def test_raises_nice_error_for_too_short_signatures_good_base64(self):
        signature = 'aa=='

        with pytest.raises(verify_signature.WrongSignatureSize):
            verify_signature(self.data, signature, self.pubkey)

    def test_raises_nice_error_for_wrong_signature(self):
        # change the signature, but keep it a valid signature
        signature = self.signature.replace('s', 'S')

        with pytest.raises(verify_signature.SignatureDoesNotMatch):
            verify_signature(self.data, signature, self.pubkey)
