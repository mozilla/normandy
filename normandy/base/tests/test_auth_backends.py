import pytest

from normandy.base.auth_backends import (
    INFO_LOGIN_SUCCESS,
    LoggingModelBackend,
    EmailOnlyRemoteUserBackend,
    WARNING_LOGIN_FAILURE,
)
from normandy.base.tests import UserFactory, Whatever


class TestLoggingModelBackend(object):
    @pytest.fixture
    def mock_logger(self, mocker):
        return mocker.patch("normandy.base.auth_backends.logger")

    @pytest.fixture
    def mock_authenticate(self, mocker):
        return mocker.patch("normandy.base.auth_backends.ModelBackend.authenticate")

    def test_log_failure_username(self, mock_logger, mock_authenticate):
        mock_authenticate.return_value = None
        user = LoggingModelBackend().authenticate(username="fakeuser", password="does.not.exist")
        assert user is None
        mock_logger.warning.assert_called_with(
            Whatever.contains("fakeuser"), extra={"code": WARNING_LOGIN_FAILURE}
        )

    def test_log_failure_no_username(self, mock_logger, mock_authenticate):
        mock_authenticate.return_value = None
        user = LoggingModelBackend().authenticate(password="does.not.exist")
        assert user is None
        mock_logger.warning.assert_called_with(
            Whatever.contains("no username provided"), extra={"code": WARNING_LOGIN_FAILURE}
        )

    def test_log_success(self, mock_logger, mock_authenticate):
        mock_authenticate.return_value = True
        user = LoggingModelBackend().authenticate(username="fakeuser", password="does.not.exist")
        assert user
        mock_logger.info.assert_called_with(
            Whatever.contains("fakeuser"), extra={"code": INFO_LOGIN_SUCCESS}
        )


@pytest.mark.django_db
class TestEmailOnlyRemoteUserBackend(object):
    @pytest.fixture
    def backend(self):
        return EmailOnlyRemoteUserBackend()

    def test_it_works(self, backend):
        user = backend.authenticate(request=None, remote_user="test@example.com")
        assert user is not None
        assert not user.is_anonymous

    def test_it_requires_an_email(self, backend):
        user = backend.authenticate(request=None, remote_user="not_an_email")
        assert user is None

    def test_it_adds_an_email_to_the_user(self, backend):
        email = "test@example.com"
        user = backend.authenticate(request=None, remote_user=email)
        assert user.email == email

    def test_existing_user(self, backend):
        email = "test@example.com"
        existing_user = UserFactory(username=email, email=email)
        logged_in_user = backend.authenticate(request=None, remote_user=email)
        assert existing_user == logged_in_user
        assert logged_in_user.email == email

    def test_existing_user_no_email(self, backend):
        email = "test@example.com"
        existing_user = UserFactory(username=email, email="")
        logged_in_user = backend.authenticate(request=None, remote_user=email)
        assert existing_user == logged_in_user
        assert logged_in_user.email == email
