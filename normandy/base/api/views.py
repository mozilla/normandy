import re

from importlib import import_module
from urllib.parse import urljoin

from django.conf import settings

from rest_framework.response import Response
from rest_framework.views import APIView

from normandy.base.api.utils import get_api_endpoints
from normandy.base.decorators import api_cache_control


class APIRootView(APIView):
    """
    An API root view that lists the urls that share it's version namespace.
    """

    _ignore_model_permissions = True
    exclude_from_schema = True
    api_urls = []

    @api_cache_control(max_age=settings.API_CACHE_TIME)
    def get(self, request, *args, **kwargs):
        ret = {}

        # Get the version namespace
        namespace = getattr(request.resolver_match, "namespace", None)
        for ns in namespace.split(":"):
            if re.match(r"v[0-9]+", ns, re.I):
                namespace = ns
                break

        urlconf = import_module(settings.ROOT_URLCONF)
        endpoints = get_api_endpoints(urlconf.urlpatterns)

        for endpoint in sorted(endpoints, key=lambda e: e["pattern"].name):
            name = endpoint["pattern"].name
            if (
                endpoint["method"] == "GET"
                and name.endswith("-list")
                and namespace in endpoint["namespace"].split(":")
            ):
                allow_cdn = getattr(endpoint["pattern"], "allow_cdn", True)

                if not allow_cdn and settings.APP_SERVER_URL:
                    base = settings.APP_SERVER_URL
                else:
                    base = request.build_absolute_uri()

                full_url = urljoin(base, endpoint["path"])

                ret[name] = full_url

        return Response(ret)
