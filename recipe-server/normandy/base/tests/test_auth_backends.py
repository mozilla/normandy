import pytest

from normandy.base.auth_backends import (
    INFO_LOGIN_SUCCESS,
    LoggingModelBackend,
    WARNING_LOGIN_FAILURE,
)
from normandy.base.tests import Whatever


class TestLoggingModelBackend(object):
    @pytest.fixture
    def mock_logger(self, mocker):
        return mocker.patch('normandy.base.auth_backends.logger')

    @pytest.fixture
    def mock_authenticate(self, mocker):
        return mocker.patch('normandy.base.auth_backends.ModelBackend.authenticate')

    def test_log_failure_username(self, mock_logger, mock_authenticate):
        mock_authenticate.return_value = None
        user = LoggingModelBackend().authenticate(username='fakeuser', password='does.not.exist')
        assert user is None
        mock_logger.warning.assert_called_with(
            Whatever.contains('fakeuser'),
            extra={'code': WARNING_LOGIN_FAILURE}
        )

    def test_log_failure_no_username(self, mock_logger, mock_authenticate):
        mock_authenticate.return_value = None
        user = LoggingModelBackend().authenticate(password='does.not.exist')
        assert user is None
        mock_logger.warning.assert_called_with(
            Whatever.contains('no username provided'),
            extra={'code': WARNING_LOGIN_FAILURE}
        )

    def test_log_success(self, mock_logger, mock_authenticate):
        mock_authenticate.return_value = True
        user = LoggingModelBackend().authenticate(username='fakeuser', password='does.not.exist')
        assert user
        mock_logger.info.assert_called_with(
            Whatever.contains('fakeuser'),
            extra={'code': INFO_LOGIN_SUCCESS}
        )
