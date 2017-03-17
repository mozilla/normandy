import os
import re

from django.conf import settings
from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.middleware import RemoteUserMiddleware

from mozilla_cloud_services_logger.django.middleware import (
    RequestSummaryLogger as OriginalRequestSummaryLogger
)
from whitenoise.middleware import WhiteNoiseMiddleware


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


class NormandyWhiteNoiseMiddleware(WhiteNoiseMiddleware):

    def is_immutable_file(self, path, url):
        """
        Determine whether given URL represents an immutable file (i.e. a
        file with a hash of its contents as part of its name) which can
        therefore be cached forever
        """
        if not url.startswith(self.static_prefix):
            return False
        filename = os.path.basename(url)
        # Check if the filename ends with either 20 or 32 hex digits, and then an extension
        # 20 is for normal hashed content, like JS or CSS files, which use "[name].[hash].[ext]"
        # 32 is for content addressed files, like images or fonts, which use "[hash].[ext]"
        match = re.match(r'^.*([a-f0-9]{20}|[a-f0-9]{32})\.[\w\d]+$', filename)
        return bool(match)
