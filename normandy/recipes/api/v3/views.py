import re

from django.db import transaction
from django.db.models import Q

import django_filters
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from normandy.base.api import UpdateOrCreateModelViewSet
from normandy.base.api.filters import AliasedOrderingFilter
from normandy.base.api.mixins import CachingViewsetMixin
from normandy.base.api.permissions import AdminEnabledOrReadOnly
from normandy.base.decorators import api_cache_control
from normandy.recipes.models import Action, ApprovalRequest, EnabledState, Recipe, RecipeRevision
from normandy.recipes.api.filters import CharSplitFilter, EnabledStateFilter
from normandy.recipes.api.v3.serializers import (
    ActionSerializer,
    ApprovalRequestSerializer,
    RecipeRevisionSerializer,
    RecipeSerializer,
)


class ActionViewSet(CachingViewsetMixin, viewsets.ReadOnlyModelViewSet):
    """Viewset for viewing recipe actions."""

    queryset = Action.objects.all()
    serializer_class = ActionSerializer
    pagination_class = None


class RecipeFilters(django_filters.FilterSet):
    enabled = EnabledStateFilter()
    action = django_filters.CharFilter(field_name="latest_revision__action__name")
    bug_number = django_filters.Filter(field_name="latest_revision__bug_number")
    channels = CharSplitFilter("latest_revision__channels__slug")
    locales = CharSplitFilter("latest_revision__locales__code")
    countries = CharSplitFilter("latest_revision__countries__code")

    class Meta:
        model = Recipe
        fields = ["action", "enabled", "latest_revision__action", "bug_number"]


class RecipeOrderingFilter(AliasedOrderingFilter):
    aliases = {
        "last_updated": ("latest_revision__updated", "Last Updated"),
        "name": ("latest_revision__name", "Name"),
    }


class RecipeViewSet(CachingViewsetMixin, UpdateOrCreateModelViewSet):
    """Viewset for viewing and uploading recipes."""

    queryset = (
        Recipe.objects.all()
        # Foreign keys
        .select_related("latest_revision")
        .select_related("latest_revision__action")
        .select_related("latest_revision__approval_request")
        # Many-to-many
        .prefetch_related("latest_revision__channels")
        .prefetch_related("latest_revision__countries")
        .prefetch_related("latest_revision__locales")
    )
    serializer_class = RecipeSerializer
    filterset_class = RecipeFilters
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend, RecipeOrderingFilter]
    permission_classes = [permissions.DjangoModelPermissionsOrAnonReadOnly, AdminEnabledOrReadOnly]

    def get_queryset(self):
        queryset = self.queryset

        if self.request.GET.get("status") == "enabled":
            queryset = queryset.only_enabled()
        elif self.request.GET.get("status") == "disabled":
            queryset = queryset.only_disabled()

        if "text" in self.request.GET:
            text = self.request.GET.get("text")
            tokens = set([text])
            tokens.update(re.split(r"[ /_-]", text))
            query = Q()
            for token in tokens:
                query |= Q(latest_revision__name__icontains=token)
                query |= Q(latest_revision__extra_filter_expression__icontains=token)
                query |= Q(latest_revision__arguments_json__icontains=token)

            queryset = queryset.filter(query)

        return queryset

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=["GET"])
    @api_cache_control()
    def history(self, request, pk=None):
        recipe = self.get_object()
        serializer = RecipeRevisionSerializer(
            recipe.revisions.all(), many=True, context={"request": request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=["POST"])
    def enable(self, request, pk=None):
        recipe = self.get_object()

        if recipe.approved_revision:
            try:
                recipe.approved_revision.enable(user=request.user)
            except EnabledState.NotActionable as e:
                return Response({"error": str(e)}, status=status.HTTP_409_CONFLICT)
        else:
            return Response(
                {"error": "Cannot enable a recipe that is not approved."},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(RecipeSerializer(recipe).data)

    @action(detail=True, methods=["POST"])
    def disable(self, request, pk=None):
        recipe = self.get_object()

        if recipe.enabled:
            try:
                recipe.approved_revision.disable(user=request.user)
            except EnabledState.NotActionable as e:
                return Response({"error": str(e)}, status=status.HTTP_409_CONFLICT)

        return Response(RecipeSerializer(recipe).data)


class RecipeRevisionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        RecipeRevision.objects.all()
        .select_related("action")
        .select_related("approval_request")
        .select_related("recipe")
        # Many-to-many
        .prefetch_related("channels")
        .prefetch_related("countries")
        .prefetch_related("locales")
    )
    serializer_class = RecipeRevisionSerializer
    permission_classes = [AdminEnabledOrReadOnly, permissions.DjangoModelPermissionsOrAnonReadOnly]
    pagination_class = None

    @action(detail=True, methods=["POST"])
    def request_approval(self, request, pk=None):
        revision = self.get_object()

        if revision.approval_status is not None:
            return Response(
                {"error": "This revision already has an approval request."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        approval_request = revision.request_approval(creator=request.user)

        return Response(
            ApprovalRequestSerializer(approval_request).data, status=status.HTTP_201_CREATED
        )


class ApprovalRequestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ApprovalRequest.objects.all()
    serializer_class = ApprovalRequestSerializer
    permission_classes = [AdminEnabledOrReadOnly, permissions.DjangoModelPermissionsOrAnonReadOnly]
    pagination_class = None

    @action(detail=True, methods=["POST"])
    def approve(self, request, pk=None):
        approval_request = self.get_object()

        if not request.data.get("comment"):
            return Response(
                {"comment": "This field is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            approval_request.approve(approver=request.user, comment=request.data.get("comment"))
        except ApprovalRequest.NotActionable:
            return Response(
                {"error": "This approval request has already been approved or rejected."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except ApprovalRequest.CannotActOnOwnRequest:
            return Response(
                {"error": "You cannot approve your own approval request."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(ApprovalRequestSerializer(approval_request).data)

    @action(detail=True, methods=["POST"])
    def reject(self, request, pk=None):
        approval_request = self.get_object()

        if not request.data.get("comment"):
            return Response(
                {"comment": "This field is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            approval_request.reject(approver=request.user, comment=request.data.get("comment"))
        except ApprovalRequest.NotActionable:
            return Response(
                {"error": "This approval request has already been approved or rejected."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except ApprovalRequest.CannotActOnOwnRequest:
            return Response(
                {"error": "You cannot reject your own approval request."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(ApprovalRequestSerializer(approval_request).data)

    @action(detail=True, methods=["POST"])
    def close(self, request, pk=None):
        approval_request = self.get_object()
        approval_request.close()
        return Response(status=status.HTTP_204_NO_CONTENT)
