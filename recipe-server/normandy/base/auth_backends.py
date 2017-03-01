import logging

from django.contrib.auth.backends import ModelBackend, RemoteUserBackend


INFO_LOGIN_SUCCESS = 'normandy.auth.I001'
WARNING_LOGIN_FAILURE = 'normandy.auth.W001'


logger = logging.getLogger(__name__)


class LoggingAuthBackendMixin(object):
    """
    Authentication backend mixin that logs the results of login attempts.
    """
    def authenticate(self, **kwargs):
        result = super().authenticate(**kwargs)

        username = None
        if 'username' in kwargs:
            username = kwargs['username']
        elif 'remote_user' in kwargs:
            username = kwargs['remote_user']

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


class LoggingModelBackend(LoggingAuthBackendMixin, ModelBackend):
    """
    Model-backed authentication backend that logs the results of login attempts.
    """


class LoggingRemoteUserBackend(LoggingAuthBackendMixin, RemoteUserBackend):
    """
    Remote-user backend that logs the results of login attempts.
    """
