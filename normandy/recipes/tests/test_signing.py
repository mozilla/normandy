import base64
import os
from datetime import datetime, timedelta
from unittest.mock import MagicMock, call

from django.core.exceptions import ImproperlyConfigured

import pytest
import pytz
from pyasn1.type import useful as pyasn1_useful
from pyasn1_modules import rfc5280

from normandy.base.tests import Whatever
from normandy.recipes import signing


@pytest.fixture
def mock_logger(mocker):
    return mocker.patch("normandy.recipes.signing.logger")


class TestAutographer(object):
    test_settings = {
        "URL": "https://autograph.example.com/",
        "HAWK_ID": "hawk id",
        "HAWK_SECRET_KEY": "hawk secret key",
    }

    def test_it_checks_settings(self, settings):
        """Test that each required key is required individually"""
        # Leave out URL
        settings.AUTOGRAPH_URL = None
        settings.AUTOGRAPH_HAWK_ID = "hawk id"
        settings.AUTOGRAPH_HAWK_SECRET_KEY = "hawk secret key"
        with pytest.raises(ImproperlyConfigured) as exc:
            signing.Autographer()
        assert "AUTOGRAPH_URL" in str(exc.value)

        # Leave out HAWK_ID
        settings.AUTOGRAPH_URL = "https://autograph.example.com"
        settings.AUTOGRAPH_HAWK_ID = None
        settings.AUTOGRAPH_HAWK_SECRET_KEY = "hawk secret key"
        with pytest.raises(ImproperlyConfigured) as exc:
            signing.Autographer()
        assert "AUTOGRAPH_HAWK_ID" in str(exc.value)

        # Leave out HAWK_SECRET_KEY
        settings.AUTOGRAPH_URL = "https://autograph.example.com"
        settings.AUTOGRAPH_HAWK_ID = "hawk id"
        settings.AUTOGRAPH_HAWK_SECRET_KEY = None
        with pytest.raises(ImproperlyConfigured) as exc:
            signing.Autographer()
        assert "AUTOGRAPH_HAWK_SECRET_KEY" in str(exc.value)

        # Include everything
        settings.AUTOGRAPH_URL = "https://autograph.example.com"
        settings.AUTOGRAPH_HAWK_ID = "hawk id"
        settings.AUTOGRAPH_HAWK_SECRET_KEY = "hawk secret key"
        # assert doesn't raise
        signing.Autographer()

    def test_it_interacts_with_autograph_correctly(self, settings, mock_logger):
        settings.AUTOGRAPH_URL = "https://autograph.example.com"
        settings.AUTOGRAPH_HAWK_ID = "hawk id"
        settings.AUTOGRAPH_HAWK_SECRET_KEY = "hawk secret key"

        autographer = signing.Autographer()
        autographer.session = MagicMock()

        autographer.session.post.return_value.json.return_value = [
            {
                "content-signature": (
                    'x5u="https://example.com/fake_x5u_1";p384ecdsa=fake_signature_1'
                ),
                "x5u": "https://example.com/fake_x5u_1",
                "hash_algorithm": "sha384",
                "ref": "fake_ref_1",
                "signature": "fake_signature_1",
            },
            {
                "content-signature": (
                    'x5u="https://example.com/fake_x5u_2";p384ecdsa=fake_signature_2'
                ),
                "x5u": "https://example.com/fake_x5u_2",
                "hash_algorithm": "sha384",
                "ref": "fake_ref_2",
                "signature": "fake_signature_2",
            },
        ]

        url = self.test_settings["URL"] + "sign/data"
        foo_base64 = base64.b64encode(b"foo").decode("utf8")
        bar_base64 = base64.b64encode(b"bar").decode("utf8")

        # Assert the correct data is returned
        assert autographer.sign_data([b"foo", b"bar"]) == [
            {
                "timestamp": Whatever(),
                "signature": "fake_signature_1",
                "x5u": "https://example.com/fake_x5u_1",
            },
            {
                "timestamp": Whatever(),
                "signature": "fake_signature_2",
                "x5u": "https://example.com/fake_x5u_2",
            },
        ]

        # Assert that logging happened
        mock_logger.info.assert_has_calls(
            [
                call(Whatever.contains("2"), extra={"code": signing.INFO_RECEIVED_SIGNATURES}),
                call(Whatever.contains("fake_ref_1")),
                call(Whatever.contains("fake_ref_2")),
            ]
        )

        # Assert the correct request was made
        assert autographer.session.post.called_once_with(
            [
                url,
                [
                    {"template": "content-signature", "input": foo_base64},
                    {"template": "content-signature", "input": bar_base64},
                ],
            ]
        )


class TestVerifySignature(object):

    # known good data
    data = '{"action":"console-log","arguments":{"message":"telemetry available"},"enabled":true,"filter_expression":"telemetry != undefined","id":1,"last_updated":"2017-01-02T11:32:07.687408Z","name":"mython\'s system addon test","revision_id":"6dc874ded7d14af9ef9c147c5d2ceef9d15b56ca933681e574cd96a50b75946e"}'  # noqa
    signature = "Prb0Jnb3icT0g_hZkgEyuzTlWrsTYrURXy6mzDTDh9WmqXdQBS05cV1mL1GUBbKIgcs02V8P1JvYR4LaJmSUvfZWYS66Jo8AdhcfEikoEZ0jvlLtiJDFxpT4eh2pk3XW"  # noqa
    pubkey = "MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEVEKiCAIkwRg1VFsP8JOYdSF6a3qvgbRPoEK9eTuLbrB6QixozscKR4iWJ8ZOOX6RPCRgFdfVDoZqjFBFNJN9QtRBk0mVtHbnErx64d2vMF0oWencS1hyLW2whgOgOz7p"  # noqa

    def test_known_good_signature(self):
        assert signing.verify_signature(self.data, self.signature, self.pubkey)

    def test_raises_nice_error_for_too_short_signatures_bad_padding(self):
        signature = "a_too_short_signature"

        with pytest.raises(signing.WrongSignatureSize):
            signing.verify_signature(self.data, signature, self.pubkey)

    def test_raises_nice_error_for_too_short_signatures_good_base64(self):
        signature = "aa=="

        with pytest.raises(signing.WrongSignatureSize):
            signing.verify_signature(self.data, signature, self.pubkey)

    def test_raises_nice_error_for_wrong_signature(self):
        # change the signature, but keep it a valid signature
        signature = self.signature.replace("s", "S")

        with pytest.raises(signing.SignatureDoesNotMatch):
            signing.verify_signature(self.data, signature, self.pubkey)


class TestExtractCertsFromPem(object):
    def test_empty(self):
        assert signing.extract_certs_from_pem("") == []

    def test_real_certs(self):
        path = os.path.join(os.path.dirname(__file__), "data", "test_certs.pem")
        with open(path) as f:
            certs = signing.extract_certs_from_pem(f.read())
        assert len(certs) == 3

    def test_incomplete_cert(self):
        bad_data = "-----BEGIN CERTIFICATE-----\nMIIGXTCCBEWgAwIBAgIEAQAACjANBgkq"
        with pytest.raises(signing.CertificateParseError) as exc:
            signing.extract_certs_from_pem(bad_data)
        assert "Unexpected end of input." in str(exc.value)

    def test_not_a_cert(self):
        bad_data = "hello world"
        with pytest.raises(signing.CertificateParseError) as exc:
            signing.extract_certs_from_pem(bad_data)
        assert 'Unexpected input "hello world"' in str(exc.value)


class TestParseCertsFromDer(object):
    def test_real_certs(self):
        path = os.path.join(os.path.dirname(__file__), "data", "test_certs.pem")
        with open(path) as f:
            ders = signing.extract_certs_from_pem(f.read())
        certs = [signing.parse_cert_from_der(der) for der in ders]

        # Quick spot check on the CommonName value of the subjects of the certs
        # If these are correct, the entire objects were probably parsed correctly
        assert (
            certs[0]["tbsCertificate"]["subject"]["rdnSequence"][4][0]["value"]
            == b"\x13&normandy.content-signature.mozilla.org"
        )
        assert (
            certs[1]["tbsCertificate"]["subject"]["rdnSequence"][3][0]["value"]
            == b"\x13'Mozilla Signing Services Intermediate 1"
        )
        assert (
            certs[2]["tbsCertificate"]["subject"]["rdnSequence"][3][0]["value"]
            == b"\x13\x16root-ca-production-amo"
        )


class TestCheckValidity(object):
    def test_it_works(self):
        now = datetime.utcnow().replace(tzinfo=pytz.utc)
        not_before = now - timedelta(days=1)
        not_after = now + timedelta(days=1)
        assert signing.check_validity(not_before, not_after, None)

    def test_not_yet_valid(self):
        now = datetime.utcnow().replace(tzinfo=pytz.utc)
        not_before = now + timedelta(days=1)
        not_after = now + timedelta(days=2)
        with pytest.raises(signing.CertificateNotYetValid):
            signing.check_validity(not_before, not_after, None)

    def test_expired(self):
        now = datetime.utcnow().replace(tzinfo=pytz.utc)
        not_before = now - timedelta(days=2)
        not_after = now - timedelta(days=1)
        with pytest.raises(signing.CertificateExpired):
            signing.check_validity(not_before, not_after, None)

    def test_expiring_early_ok(self):
        now = datetime.utcnow().replace(tzinfo=pytz.utc)
        not_before = now - timedelta(days=1)
        not_after = now + timedelta(days=3)
        expire_early = timedelta(days=2)
        assert signing.check_validity(not_before, not_after, expire_early)

    def test_expiring_early_not_ok(self):
        now = datetime.utcnow().replace(tzinfo=pytz.utc)
        not_before = now - timedelta(days=1)
        not_after = now + timedelta(days=1)
        expire_early = timedelta(days=2)
        with pytest.raises(signing.CertificateExpiringSoon):
            signing.check_validity(not_before, not_after, expire_early)


class TestVerifyX5u(object):
    def _fake_cert(self, not_before=None, not_after=None):
        fake_cert = rfc5280.Certificate()
        fake_cert["tbsCertificate"] = rfc5280.TBSCertificate()
        fake_cert["tbsCertificate"]["validity"] = rfc5280.Validity()

        if not_before:
            fake_cert["tbsCertificate"]["validity"]["notBefore"] = rfc5280.Time()
            fake_cert["tbsCertificate"]["validity"]["notBefore"][
                "utcTime"
            ] = pyasn1_useful.UTCTime.fromDateTime(not_before)
        if not_after:
            fake_cert["tbsCertificate"]["validity"]["notAfter"] = rfc5280.Time()
            fake_cert["tbsCertificate"]["validity"]["notAfter"][
                "utcTime"
            ] = pyasn1_useful.UTCTime.fromDateTime(not_after)

        return fake_cert

    def test_it_works(self, mocker, settings):
        settings.CERTIFICATES_CHECK_VALIDITY = True
        settings.CERTIFICATES_EXPECTED_ROOT_HASH = None
        settings.CERTIFICATES_EXPECTED_SUBJECT_CN = None

        mock_requests = mocker.patch("normandy.recipes.signing.requests")
        mock_extract_certs_from_pem = mocker.patch(
            "normandy.recipes.signing.extract_certs_from_pem"
        )
        mock_parse_cert_from_der = mocker.patch("normandy.recipes.signing.parse_cert_from_der")

        url = "https://example.com/cert.pem"
        now = datetime.now()
        not_before = now - timedelta(days=1)
        not_after = now + timedelta(days=1)

        mock_extract_certs_from_pem.return_value = ["a", "b"]
        mock_parse_cert_from_der.return_value = self._fake_cert(
            not_before=not_before, not_after=not_after
        )

        assert signing.verify_x5u(url)
        assert mock_requests.get.called_once_with(url)
        body = mock_requests.get.return_value.content.decode.return_value
        assert mock_extract_certs_from_pem.called_once_with(body)
        assert mock_parse_cert_from_der.called_twice()

    def test_invalid_dates(self, mocker, settings):
        settings.CERTIFICATES_CHECK_VALIDITY = True
        settings.CERTIFICATES_EXPECTED_ROOT_HASH = None
        settings.CERTIFICATES_EXPECTED_SUBJECT_CN = None

        mock_requests = mocker.patch("normandy.recipes.signing.requests")
        mock_extract_certs_from_pem = mocker.patch(
            "normandy.recipes.signing.extract_certs_from_pem"
        )
        mock_parse_cert_from_der = mocker.patch("normandy.recipes.signing.parse_cert_from_der")

        url = "https://example.com/cert.pem"
        now = datetime.now().replace(tzinfo=pytz.UTC)
        not_before = now - timedelta(days=2)
        not_after = now - timedelta(days=1)

        mock_extract_certs_from_pem.return_value = ["a"]
        mock_parse_cert_from_der.return_value = self._fake_cert(
            not_before=not_before, not_after=not_after
        )

        with pytest.raises(signing.CertificateExpired):
            signing.verify_x5u(url)
        assert mock_requests.get.called_once_with(url)
        body = mock_requests.get.return_value.content.decode.return_value
        assert mock_extract_certs_from_pem.called_once_with(body)
        assert mock_parse_cert_from_der.called_once_with(
            mock_extract_certs_from_pem.return_value[0]
        )

    def test_mixed_timestamp_format(self, mocker):
        # The certificate used for testing expired on 2018-04-24. This test is
        # only concerned with the parsing of the dates, so mock the call to the
        # validate function and assert about the values of the dates.
        mock_requests = mocker.patch("normandy.recipes.signing.requests")
        mock_check_validity = mocker.patch("normandy.recipes.signing.check_validity")
        path = os.path.join(os.path.dirname(__file__), "data", "mixed_timestamps_certs.pem")
        with open(path, "rb") as f:
            mock_requests.get.return_value.content = f.read()
        assert signing.verify_x5u("https://example.com/cert.pem")
        assert mock_check_validity.mock_calls == [
            call(
                datetime(2017, 12, 25, tzinfo=pytz.UTC),
                datetime(2018, 4, 24, tzinfo=pytz.UTC),
                None,
            ),
            call(
                datetime(2017, 5, 4, 0, 12, 39, tzinfo=pytz.UTC),
                datetime(2019, 5, 4, 0, 12, 39, tzinfo=pytz.UTC),
                None,
            ),
            call(
                datetime(2015, 3, 17, 22, 53, 57, tzinfo=pytz.UTC),
                datetime(2025, 3, 14, 22, 53, 57, tzinfo=pytz.UTC),
                None,
            ),
        ]

    def test_it_checks_cert_root(self, mocker, settings):
        path = os.path.join(os.path.dirname(__file__), "data", "test_certs.pem")
        with open(path) as f:
            cert_pem = f.read()

        settings.CERTIFICATES_CHECK_VALIDITY = False
        settings.CERTIFICATES_EXPECTED_ROOT_HASH = "CO:FF:EE:CO:FF:EE:CO:FF:EE:CO:FF:EE:CO:FF:EE:CO:FF:EE:CO:FF:EE:CO:FF:EE:CO:FF:EE:CO:FF:EE:CO:FF"
        settings.CERTIFICATES_EXPECTED_SUBJECT_CN = None

        mock_requests = mocker.patch("normandy.recipes.signing.requests")
        mock_requests.get.return_value.content.decode.return_value = cert_pem

        with pytest.raises(signing.CertificateHasWrongRoot):
            signing.verify_x5u("https://example.com/cert.pem")

    def test_it_checks_cert_subject(self, mocker, settings):
        path = os.path.join(os.path.dirname(__file__), "data", "test_certs.pem")
        with open(path) as f:
            cert_pem = f.read()

        settings.CERTIFICATES_CHECK_VALIDITY = False
        settings.CERTIFICATES_EXPECTED_ROOT_HASH = None
        settings.CERTIFICATES_EXPECTED_SUBJECT_CN = "wrong.subject.example.com"

        mock_requests = mocker.patch("normandy.recipes.signing.requests")
        mock_requests.get.return_value.content.decode.return_value = cert_pem

        with pytest.raises(signing.CertificateHasWrongSubject):
            signing.verify_x5u("https://example.com/cert.pem")


class TestReadTimestampObject(object):
    def test_it_reads_utc_time_format(self):
        dt = datetime(2018, 1, 25, 16, 1, 13, 0, tzinfo=pytz.UTC)
        obj = rfc5280.Time()
        obj["utcTime"] = pyasn1_useful.UTCTime.fromDateTime(dt)
        assert signing.read_timestamp_object(obj) == dt

    def test_it_reads_general_time_format(self):
        dt = datetime(2018, 1, 25, 16, 1, 13, 0, tzinfo=pytz.UTC)
        obj = rfc5280.Time()
        obj["generalTime"] = pyasn1_useful.GeneralizedTime.fromDateTime(dt)
        assert signing.read_timestamp_object(obj) == dt

    def test_it_errors_on_unsupported_formats(self):
        with pytest.raises(signing.BadCertificate) as exc:
            signing.read_timestamp_object({"unsupportedTimestamp": b"gibberish"})
        assert "Timestamp not in expected format" in str(exc.value)
        assert "unsupportedTimestamp" in str(exc.value)
