import logging

from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.contrib.auth.backends import ModelBackend, RemoteUserBackend
from django.contrib.auth import get_user_model


INFO_LOGIN_SUCCESS = "normandy.auth.I001"
WARNING_LOGIN_FAILURE = "normandy.auth.W001"


logger = logging.getLogger(__name__)
UserModel = get_user_model()


class LoggingAuthBackendMixin(object):
    """
    Authentication backend mixin that logs the results of login attempts.
    """

    def get_username(self, **kwargs):
        raise NotImplemented()

    def authenticate(self, request, **kwargs):
        result = super().authenticate(request, **kwargs)
        username = self.get_username(**kwargs)

        if result is None:
            if username is not None:
                logger.warning(
                    f'Login attempt failed for user "{username}".',
                    extra={"code": WARNING_LOGIN_FAILURE},
                )
            else:
                logger.warning(
                    "Login attempt failed (no username provided).",
                    extra={"code": WARNING_LOGIN_FAILURE},
                )
        else:
            logger.info(
                f'Login attempt succeeded for user "{username}".',
                extra={"code": INFO_LOGIN_SUCCESS},
            )
        return result


class LoggingModelBackend(LoggingAuthBackendMixin, ModelBackend):
    """
    Model-backed authentication backend that logs the results of login attempts.
    """

    def get_username(self, username=None, **kwargs):
        return username


class EmailOnlyRemoteUserBackend(LoggingAuthBackendMixin, RemoteUserBackend):
    """
    Remote-user backend that logs the results of login attempts.
    """

    def get_username(self, remote_user=None, **kwargs):
        return remote_user

    create_unknown_user = True

    def authenticate(self, request, remote_user):
        """
        The username passed as ``remote_user`` is considered trusted. Return
        the ``User`` object with the given username. Create a new ``User``
        object if ``create_unknown_user`` is ``True``.

        Return None if ``create_unknown_user`` is ``False`` and a ``User``
        object with the given username is not found in the database.

        Requires that "usernames" be in the form of an email address, and
        populates the email of returned users with the value.
        """
        if not remote_user:
            return None
        user = None
        email = self.clean_username(remote_user)

        try:
            validate_email(email)
        except ValidationError:
            return None

        user, created = UserModel._default_manager.get_or_create(
            **{UserModel.USERNAME_FIELD: email}, defaults={UserModel.EMAIL_FIELD: email}
        )
        if user.email != email:
            user.email = email
            user.save()

        return user if self.user_can_authenticate(user) else None
