from django.conf import settings
from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.middleware import RemoteUserMiddleware

from mozilla_cloud_services_logger.django.middleware import (
    RequestSummaryLogger as OriginalRequestSummaryLogger
)


def request_received_at_middleware(get_response):
    """
    Adds a 'received_at' property to requests with a datetime showing
    when the request was received by Django.
    """

    def middleware(request):
        request.received_at = timezone.now()
        return get_response(request)

    return middleware


class RequestSummaryLogger(MiddlewareMixin, OriginalRequestSummaryLogger):
    """
    Adapt mozilla_cloud_services_logger's request logger to Django 1.10 new-style middleware.
    """
    pass


class ConfigurableRemoteUserMiddleware(RemoteUserMiddleware):
    """
    Makes RemoteUserMiddleware customizable via settings.
    """

    @property
    def header(self):
        """
        Name of request header to grab username from.

        This will be the key as used in the request.META dictionary. To
        reference HTTP headers, this value should be all upper case and
        prefixed with "HTTP_".
        """
        return settings.OIDC_REMOTE_AUTH_HEADER
