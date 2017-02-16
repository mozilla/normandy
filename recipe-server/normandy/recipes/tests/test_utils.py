import base64
from unittest.mock import MagicMock
from random import random
from fractions import Fraction

from django.core.exceptions import ImproperlyConfigured

import pytest

from normandy.base.tests import Whatever
from normandy.recipes.utils import (
    Autographer,
    fraction_to_key,
    INFO_RECEIVED_SIGNATURES,
    verify_signature,
)


@pytest.fixture
def mock_logger(mocker):
    return mocker.patch('normandy.recipes.utils.logger')


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

    def test_it_interacts_with_autograph_correctly(self, settings, mock_logger):
        settings.AUTOGRAPH_URL = 'https://autograph.example.com'
        settings.AUTOGRAPH_HAWK_ID = 'hawk id'
        settings.AUTOGRAPH_HAWK_SECRET_KEY = 'hawk secret key'

        autographer = Autographer()
        autographer.session = MagicMock()

        autographer.session.post.return_value.json.return_value = [
            {
                'content-signature': (
                    'x5u="https://example.com/fake_x5u_1";p384ecdsa=fake_signature_1'
                ),
                'x5u': 'https://example.com/fake_x5u_1',
                'hash_algorithm': 'sha384',
                'ref': 'fake_ref_1',
                'signature': 'fake_signature_1',
                'public_key': 'fake_pubkey_1',
            },
            {
                'content-signature': (
                    'x5u="https://example.com/fake_x5u_2";p384ecdsa=fake_signature_2'
                ),
                'x5u': 'https://example.com/fake_x5u_2',
                'hash_algorithm': 'sha384',
                'ref': 'fake_ref_2',
                'signature': 'fake_signature_2',
                'public_key': 'fake_pubkey_2',
            }
        ]

        url = self.test_settings['URL'] + 'sign/data'
        foo_base64 = base64.b64encode(b'foo').decode('utf8')
        bar_base64 = base64.b64encode(b'bar').decode('utf8')

        # Assert the correct data is returned
        assert autographer.sign_data([b'foo', b'bar']) == [
            {
                'timestamp': Whatever(),
                'signature': 'fake_signature_1',
                'x5u': 'https://example.com/fake_x5u_1',
                'public_key': 'fake_pubkey_1',
            },
            {
                'timestamp': Whatever(),
                'signature': 'fake_signature_2',
                'x5u': 'https://example.com/fake_x5u_2',
                'public_key': 'fake_pubkey_2',
            }
        ]

        # Assert that logging happened
        mock_logger.info.assert_called_with(
            Whatever.contains('2'),
            extra={'code': INFO_RECEIVED_SIGNATURES}
        )

        # Assert the correct request was made
        assert autographer.session.post.called_once_with(
            [url, [
                {'template': 'content-signature', 'input': foo_base64},
                {'template': 'content-signature', 'input': bar_base64},
            ]]
        )


class TestVerifySignature(object):

    # known good data
    data = '{"action":"console-log","arguments":{"message":"telemetry available"},"enabled":true,"filter_expression":"telemetry != undefined","id":1,"last_updated":"2017-01-02T11:32:07.687408Z","name":"mython\'s system addon test","revision_id":"6dc874ded7d14af9ef9c147c5d2ceef9d15b56ca933681e574cd96a50b75946e"}'  # noqa
    signature = 'Prb0Jnb3icT0g_hZkgEyuzTlWrsTYrURXy6mzDTDh9WmqXdQBS05cV1mL1GUBbKIgcs02V8P1JvYR4LaJmSUvfZWYS66Jo8AdhcfEikoEZ0jvlLtiJDFxpT4eh2pk3XW'  # noqa
    pubkey = 'MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEVEKiCAIkwRg1VFsP8JOYdSF6a3qvgbRPoEK9eTuLbrB6QixozscKR4iWJ8ZOOX6RPCRgFdfVDoZqjFBFNJN9QtRBk0mVtHbnErx64d2vMF0oWencS1hyLW2whgOgOz7p'  # noqa

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
