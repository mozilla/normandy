import logging

from django.contrib.auth.backends import ModelBackend


INFO_LOGIN_SUCCESS = 'normandy.auth.I001'
WARNING_LOGIN_FAILURE = 'normandy.auth.W001'


logger = logging.getLogger(__name__)


class LoggingModelBackend(ModelBackend):
    """
    Model-backed authentication backend that logs the results of login
    attempts.
    """
    def authenticate(self, username=None, **kwargs):
        result = super().authenticate(username=username, **kwargs)
        if result is None:
            if username is not None:
                logger.warning(
                    f'Login attempt failed for user "{username}".',
                    extra={'code': WARNING_LOGIN_FAILURE}
                )
            else:
                logger.warning(
                    'Login attempt failed (no username provided).',
                    extra={'code': WARNING_LOGIN_FAILURE}
                )
        else:
            logger.info(
                f'Login attempt succeeded for user "{username}".',
                extra={'code': INFO_LOGIN_SUCCESS}
            )
        return result
