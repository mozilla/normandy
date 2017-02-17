from urllib.parse import urljoin

from django.conf import settings

from rest_framework.compat import NoReverseMatch
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.views import APIView


class APIRootView(APIView):
    """
    An API root view that lists the urls passed to it via api_urls.
    """

    _ignore_model_permissions = True
    exclude_from_schema = True
    api_urls = []

    def get(self, request, *args, **kwargs):
        ret = {}

        namespace = getattr(request.resolver_match, 'namespace', None)
        for api_url in self.api_urls:
            url_name = api_url.name
            if namespace:
                url_name = namespace + ':' + url_name

            try:
                allow_cdn = getattr(api_url, 'allow_cdn', True)
                if not allow_cdn and settings.APP_SERVER_URL:
                    base = settings.APP_SERVER_URL
                else:
                    base = request.build_absolute_uri()

                path = reverse(url_name, *args, **kwargs)
                full_url = urljoin(base, path)
                ret[api_url.name] = full_url
            except NoReverseMatch:
                pass

        return Response(ret)
