import base64
import os
from datetime import datetime, timedelta
from unittest.mock import MagicMock

from django.core.exceptions import ImproperlyConfigured

import pytest

from normandy.base.tests import Whatever
from normandy.recipes import signing


@pytest.fixture
def mock_logger(mocker):
    return mocker.patch('normandy.recipes.signing.logger')


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
            signing.Autographer()
        assert 'AUTOGRAPH_URL' in str(exc)

        # Leave out HAWK_ID
        settings.AUTOGRAPH_URL = 'https://autograph.example.com'
        settings.AUTOGRAPH_HAWK_ID = None
        settings.AUTOGRAPH_HAWK_SECRET_KEY = 'hawk secret key'
        with pytest.raises(ImproperlyConfigured) as exc:
            signing.Autographer()
        assert 'AUTOGRAPH_HAWK_ID' in str(exc)

        # Leave out HAWK_SECRET_KEY
        settings.AUTOGRAPH_URL = 'https://autograph.example.com'
        settings.AUTOGRAPH_HAWK_ID = 'hawk id'
        settings.AUTOGRAPH_HAWK_SECRET_KEY = None
        with pytest.raises(ImproperlyConfigured) as exc:
            signing.Autographer()
        assert 'AUTOGRAPH_HAWK_SECRET_KEY' in str(exc)

        # Include everything
        settings.AUTOGRAPH_URL = 'https://autograph.example.com'
        settings.AUTOGRAPH_HAWK_ID = 'hawk id'
        settings.AUTOGRAPH_HAWK_SECRET_KEY = 'hawk secret key'
        # assert doesn't raise
        signing.Autographer()

    def test_it_interacts_with_autograph_correctly(self, settings, mock_logger):
        settings.AUTOGRAPH_URL = 'https://autograph.example.com'
        settings.AUTOGRAPH_HAWK_ID = 'hawk id'
        settings.AUTOGRAPH_HAWK_SECRET_KEY = 'hawk secret key'

        autographer = signing.Autographer()
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
            extra={'code': signing.INFO_RECEIVED_SIGNATURES}
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
        assert signing.verify_signature(self.data, self.signature, self.pubkey)

    def test_raises_nice_error_for_too_short_signatures_bad_padding(self):
        signature = 'a_too_short_signature'

        with pytest.raises(signing.WrongSignatureSize):
            signing.verify_signature(self.data, signature, self.pubkey)

    def test_raises_nice_error_for_too_short_signatures_good_base64(self):
        signature = 'aa=='

        with pytest.raises(signing.WrongSignatureSize):
            signing.verify_signature(self.data, signature, self.pubkey)

    def test_raises_nice_error_for_wrong_signature(self):
        # change the signature, but keep it a valid signature
        signature = self.signature.replace('s', 'S')

        with pytest.raises(signing.SignatureDoesNotMatch):
            signing.verify_signature(self.data, signature, self.pubkey)


class TestParsePemToCerts(object):

    def test_empty(self):
        assert signing.parse_pem_to_certs('') == []

    def test_real_certs(self):
        path = os.path.join(os.path.dirname(__file__), 'data', 'test_certs.pem')
        with open(path) as f:
            certs = signing.parse_pem_to_certs(f.read())

        assert len(certs) == 3
        # Quick spot check on the CommonName value of the subjects of the certs
        # If these are correct, the entire objects were probably parsed correctly
        assert (certs[0]['tbsCertificate']['subject']['rdnSequence'][4][0]['value'] ==
                b'\x13&normandy.content-signature.mozilla.org')
        assert (certs[1]['tbsCertificate']['subject']['rdnSequence'][3][0]['value'] ==
                b"\x13'Mozilla Signing Services Intermediate 1")
        assert (certs[2]['tbsCertificate']['subject']['rdnSequence'][3][0]['value'] ==
                b'\x13\x16root-ca-production-amo')

    def test_incomplete_cert(self):
        bad_data = '-----BEGIN CERTIFICATE-----\nMIIGXTCCBEWgAwIBAgIEAQAACjANBgkq'
        with pytest.raises(signing.CertificateParseError) as exc:
            signing.parse_pem_to_certs(bad_data)
        assert 'Unexpected end of input.' in str(exc)

    def test_not_a_cert(self):
        bad_data = 'hello world'
        with pytest.raises(signing.CertificateParseError) as exc:
            signing.parse_pem_to_certs(bad_data)
        assert 'Unexpected input "hello world"' in str(exc)


class TestCheckValidity(object):

    def test_it_works(self):
        now = datetime.now()
        not_before = now - timedelta(days=1)
        not_after = now + timedelta(days=1)
        assert signing.check_validity(not_before, not_after, None)

    def test_not_yet_valid(self):
        now = datetime.now()
        not_before = now + timedelta(days=1)
        not_after = now + timedelta(days=2)
        with pytest.raises(signing.CertificateNotYetValid):
            signing.check_validity(not_before, not_after, None)

    def test_expired(self):
        now = datetime.now()
        not_before = now - timedelta(days=2)
        not_after = now - timedelta(days=1)
        with pytest.raises(signing.CertificateExpired):
            signing.check_validity(not_before, not_after, None)

    def test_expiring_early_ok(self):
        now = datetime.now()
        not_before = now - timedelta(days=1)
        not_after = now + timedelta(days=3)
        expire_early = timedelta(days=2)
        assert signing.check_validity(not_before, not_after, expire_early)

    def test_expiring_early_not_ok(self):
        now = datetime.now()
        not_before = now - timedelta(days=1)
        not_after = now + timedelta(days=1)
        expire_early = timedelta(days=2)
        with pytest.raises(signing.CertificateExpiringSoon):
            signing.check_validity(not_before, not_after, expire_early)


class TestVerifyX5u(object):

    def test_it_works(self, mocker):
        mock_requests = mocker.patch('normandy.recipes.signing.requests')
        mock_parse_pem_to_certs = mocker.patch('normandy.recipes.signing.parse_pem_to_certs')

        date_format = '%y%m%d%H%M%SZ'
        url = 'https://example.com/cert.pem'
        now = datetime.now()
        not_before = (now - timedelta(days=1)).strftime(date_format).encode()
        not_after = (now + timedelta(days=1)).strftime(date_format).encode()

        mock_parse_pem_to_certs.return_value = [
            {
                'tbsCertificate': {
                    'validity': {
                        'notBefore': {'utcTime': not_before},
                        'notAfter': {'utcTime': not_after},
                    }
                }
            },
            {
                'tbsCertificate': {
                    'validity': {
                        'notBefore': {'utcTime': not_before},
                        'notAfter': {'utcTime': not_after},
                    }
                }
            },
        ]

        assert signing.verify_x5u(url)
        assert mock_requests.get.called_once_with(url)
        body = mock_requests.get.return_value.content.decode.return_value
        assert mock_parse_pem_to_certs.called_once_with(body)

    def test_invalid_dates(self, mocker):
        mock_requests = mocker.patch('normandy.recipes.signing.requests')
        mock_parse_pem_to_certs = mocker.patch('normandy.recipes.signing.parse_pem_to_certs')

        date_format = '%y%m%d%H%M%SZ'
        url = 'https://example.com/cert.pem'
        now = datetime.now()
        not_before = (now - timedelta(days=2)).strftime(date_format).encode()
        not_after = (now - timedelta(days=1)).strftime(date_format).encode()

        mock_parse_pem_to_certs.return_value = [{
            'tbsCertificate': {
                'validity': {
                    'notBefore': {'utcTime': not_before},
                    'notAfter': {'utcTime': not_after},
                }
            }
        }]

        with pytest.raises(signing.CertificateExpired):
            signing.verify_x5u(url)
        assert mock_requests.get.called_once_with(url)
        body = mock_requests.get.return_value.content.decode.return_value
        assert mock_parse_pem_to_certs.called_once_with(body)
