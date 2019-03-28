import re

from importlib import import_module
from urllib.parse import urljoin

from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from django.urls import NoReverseMatch

from rest_framework import status
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.views import (
    APIView,
    exception_handler as original_exception_handler,
    set_rollback,
)

from normandy.base.api.utils import get_api_endpoints
from normandy.base.decorators import api_cache_control


class APIRootView(APIView):
    """
    An API root view that lists the urls that share it's version namespace.
    """

    _ignore_model_permissions = True
    exclude_from_schema = True
    urlconf = None

    @api_cache_control(max_age=settings.API_CACHE_TIME)
    def get(self, request, *args, **kwargs):
        ret = {}

        # Get the version namespace
        namespace = getattr(request.resolver_match, "namespace", "")
        for ns in namespace.split(":"):
            if re.match(r"v[0-9]+", ns, re.I):
                namespace = ns
                break

        if self.urlconf:
            urlconf = self.urlconf
        else:
            urlconf = import_module(settings.ROOT_URLCONF)
        endpoints = get_api_endpoints(urlconf.urlpatterns)

        for endpoint in sorted(endpoints, key=lambda e: e["pattern"].name):
            name = endpoint["pattern"].name
            if endpoint["method"] == "GET" and namespace in endpoint["namespace"].split(":"):
                allow_cdn = getattr(endpoint["pattern"], "allow_cdn", True)

                if not allow_cdn and settings.APP_SERVER_URL:
                    base = settings.APP_SERVER_URL
                else:
                    base = request.build_absolute_uri()

                try:
                    full_name = (
                        f'{endpoint["namespace"]}:{name}' if endpoint["namespace"] else name
                    )
                    path = reverse(full_name, *args, **kwargs)
                except NoReverseMatch:
                    continue

                full_url = urljoin(base, path)
                ret[name] = full_url

        return Response(ret)


def exception_handler(exc, context):
    """
    Returns the response that should be used for any given exception.

    Adds support the DRF default to also handle django.core.exceptions.ValidationError

    Any unhandled exceptions may return `None`, which will cause a 500 error
    to be raised.
    """
    response = original_exception_handler(exc, context)

    if response:
        return response

    elif isinstance(exc, DjangoValidationError):
        data = {"messages": exc.messages}
        set_rollback()
        return Response(data, status=status.HTTP_400_BAD_REQUEST)

    return None
