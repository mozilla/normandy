from urllib.parse import urljoin

from django.contrib.auth.models import Group, User
from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from django.urls import NoReverseMatch

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.views import (
    APIView,
    exception_handler as original_exception_handler,
    set_rollback,
)

from normandy.base.api.permissions import AdminEnabled, CanChangeUser
from normandy.base.api.serializers import (
    GroupSerializer,
    ServiceInfoSerializer,
    UserOnlyNamesSerializer,
    UserSerializer,
    UserWithGroupsSerializer,
)
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

        namespace = getattr(request.resolver_match, "namespace", None)
        for api_url in self.api_urls:
            url_name = api_url.name
            if namespace:
                url_name = namespace + ":" + url_name

            try:
                allow_cdn = getattr(api_url, "allow_cdn", True)
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
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        return Response(UserSerializer(request.user).data)


class ServiceInfoView(APIView):
    def get(self, request):
        if request.user.is_authenticated:
            user = request.user
        else:
            user = None

        return Response(
            ServiceInfoSerializer(
                {
                    "user": user,
                    "peer_approval_enforced": settings.PEER_APPROVAL_ENFORCED,
                    "github_url": settings.GITHUB_URL,
                }
            ).data
        )


class UserViewSet(viewsets.ModelViewSet):
    """Viewset for managing users."""

    # Order by ID to prevent UnorderedObjectListWarning
    queryset = User.objects.order_by("id")
    serializer_class = UserWithGroupsSerializer
    permission_classes = (AdminEnabled, CanChangeUser)

    def get_serializer_class(self):
        # Don't allow users to update email address
        if self.request.method in ("PUT", "PATCH"):
            return UserOnlyNamesSerializer
        return self.serializer_class

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # Should not be able to delete self
        if request.user == instance:
            return Response(status=status.HTTP_403_FORBIDDEN)

        return super().destroy(request, *args, **kwargs)


class GroupViewSet(viewsets.ModelViewSet):
    """Viewset for managing groups."""

    # Order by ID to prevent UnorderedObjectListWarning
    queryset = Group.objects.order_by("id")
    serializer_class = GroupSerializer
    permission_classes = (AdminEnabled, CanChangeUser)

    @action(detail=True, methods=["POST"])
    def add_user(self, request, pk=None):
        group = self.get_object()

        if not request.data.get("user_id"):
            return Response(
                {"user_id": "This field is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(pk=request.data.get("user_id"))
        except User.DoesNotExist:
            return Response({"user_id": "Invalid user ID."}, status=status.HTTP_400_BAD_REQUEST)

        if request.user == user:
            return Response(status=status.HTTP_403_FORBIDDEN)

        user.groups.add(group)

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["POST"])
    def remove_user(self, request, pk=None):
        group = self.get_object()

        if not request.data.get("user_id"):
            return Response(
                {"user_id": "This field is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(pk=request.data.get("user_id"))
        except User.DoesNotExist:
            return Response({"user_id": "Invalid user ID."}, status=status.HTTP_400_BAD_REQUEST)

        if user.groups.filter(pk=group.pk).count() == 0:
            return Response(
                {"user_id": "User is not in group."}, status=status.HTTP_400_BAD_REQUEST
            )

        user.groups.remove(group)

        return Response(status=status.HTTP_204_NO_CONTENT)


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
