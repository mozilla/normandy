from urllib.parse import urljoin

from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import status
from rest_framework.compat import NoReverseMatch, set_rollback
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.views import APIView, exception_handler as original_exception_handler

from normandy.base.api.serializers import UserSerializer, ServiceInfoSerializer
from normandy.base.decorators import api_cache_control


class APIRootView(APIView):
    """
    An API root view that lists the urls passed to it via api_urls.
    """

    _ignore_model_permissions = True
    exclude_from_schema = True
    api_urls = []

    @api_cache_control(max_age=settings.API_CACHE_TIME)
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


class CurrentUserView(APIView):
    def get(self, request):
        if not request.user.is_authenticated():
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        return Response(UserSerializer(request.user).data)


class ServiceInfoView(APIView):
    def get(self, request):
        if request.user.is_authenticated():
            user = request.user
        else:
            user = None

        return Response(ServiceInfoSerializer({
            'user': user,
            'peer_approval_enforced': settings.PEER_APPROVAL_ENFORCED,
            'logout_url': settings.OIDC_LOGOUT_URL or reverse('control:logout'),
            'github_url': settings.GITHUB_URL,
            'experimenter_api_url': settings.EXPERIMENTER_API_URL,
        }).data)


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
        data = {'messages': exc.messages}
        set_rollback()
        return Response(data, status=status.HTTP_400_BAD_REQUEST)

    return None
