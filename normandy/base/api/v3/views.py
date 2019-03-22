from django.contrib.auth.models import Group, User
from django.conf import settings

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from normandy.base.api.permissions import AdminEnabled, CanChangeUser
from normandy.base.api.v3.serializers import (
    GroupSerializer,
    ServiceInfoSerializer,
    UserOnlyNamesSerializer,
    UserWithGroupsSerializer,
)


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
