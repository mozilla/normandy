import re

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.http import HttpResponse

import django_filters
from rest_framework import permissions, status, views, viewsets, filters
from rest_framework.decorators import action
from rest_framework.exceptions import ParseError
from rest_framework.response import Response

from normandy.base.api import UpdateOrCreateModelViewSet
from normandy.base.api.filters import AliasedOrderingFilter
from normandy.base.api.mixins import CachingViewsetMixin
from normandy.base.api.permissions import AdminEnabledOrReadOnly
from normandy.base.decorators import api_cache_control
from normandy.recipes.models import (
    Action,
    ApprovalRequest,
    EnabledState,
    Channel,
    Country,
    Locale,
    Recipe,
    RecipeRevision,
)
from normandy.recipes.api.filters import (
    ApprovalStateFilter,
    CharSplitFilter,
    EnabledStateFilter,
    BaselineCapabilitiesFilter,
    FilterObjectFieldFilter,
)
from normandy.recipes.api.v3 import shield_identicon
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


class RecipeFilters(django_filters.FilterSet):
    enabled = EnabledStateFilter()
    action = django_filters.CharFilter(field_name="latest_revision__action__name")
    experimenter_slug = django_filters.CharFilter(field_name="latest_revision__experimenter_slug")
    channels = CharSplitFilter("latest_revision__channels__slug")
    locales = CharSplitFilter("latest_revision__locales__code")
    countries = CharSplitFilter("latest_revision__countries__code")
    uses_only_baseline_capabilities = BaselineCapabilitiesFilter()
    filter_object = FilterObjectFieldFilter()

    class Meta:
        model = Recipe
        fields = ["action", "enabled", "latest_revision__action", "experimenter_slug"]


class RecipeOrderingFilter(AliasedOrderingFilter):
    aliases = {
        "last_updated": ("latest_revision__updated", "Last Updated"),
        "name": ("latest_revision__name", "Name"),
        "action": ("latest_revision__action__name", "Action"),
    }


class RecipeViewSet(CachingViewsetMixin, UpdateOrCreateModelViewSet):
    """Viewset for viewing and uploading recipes."""

    queryset = (
        Recipe.objects.all()
        .select_related(
            "approved_revision__action",
            "approved_revision__user",
            "approved_revision__approval_request",
            "approved_revision__approval_request__creator",
            "approved_revision__approval_request__approver",
            "latest_revision__action",
            "latest_revision__user",
            "latest_revision__approval_request",
            "latest_revision__approval_request__creator",
            "latest_revision__approval_request__approver",
        )
        .prefetch_related(
            "approved_revision__channels",
            "approved_revision__countries",
            "approved_revision__enabled_states",
            "approved_revision__enabled_states__creator",
            "approved_revision__locales",
            "latest_revision__channels",
            "latest_revision__countries",
            "latest_revision__enabled_states",
            "latest_revision__enabled_states__creator",
            "latest_revision__locales",
        )
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
            if "\x00" in text:
                raise ParseError("Null bytes in text")
            tokens = set(re.split(r"[ /_-]", text))
            query = Q()
            for token in tokens:
                query &= (
                    Q(latest_revision__name__icontains=token)
                    | Q(latest_revision__extra_filter_expression__icontains=token)
                    | Q(latest_revision__arguments_json__icontains=token)
                )

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
            recipe.revisions.all().order_by("-id"), many=True, context={"request": request}
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

        recipe.latest_revision.refresh_from_db()
        return Response(RecipeSerializer(recipe).data)

    @action(detail=True, methods=["POST"])
    def disable(self, request, pk=None):
        recipe = self.get_object()

        try:
            recipe.approved_revision.disable(user=request.user)
        except EnabledState.NotActionable as e:
            return Response({"error": str(e)}, status=status.HTTP_409_CONFLICT)

        recipe.latest_revision.refresh_from_db()
        return Response(RecipeSerializer(recipe).data)


class RecipeRevisionFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        if start := request.query_params.get("created_start"):
            queryset = queryset.filter(created__gte=start)
        if end := request.query_params.get("created_end"):
            queryset = queryset.filter(created__lte=end)
        return queryset


class RecipeRevisionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        RecipeRevision.objects.all()
        .select_related("action", "approval_request", "recipe")
        .prefetch_related("enabled_states", "channels", "countries", "locales")
    )
    serializer_class = RecipeRevisionSerializer
    permission_classes = [AdminEnabledOrReadOnly, permissions.DjangoModelPermissionsOrAnonReadOnly]
    filter_backends = [RecipeRevisionFilterBackend]

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

    @action(detail=True, methods=["GET", "OPTIONS", "PATCH"])
    def metadata(self, request, pk=None):
        revision = self.get_object()

        if request.method == "PATCH":
            revision.metadata.update(request.data)
            for key, val in request.data.items():
                if val is None:
                    del revision.metadata[key]

            revision.save()

        return Response(revision.metadata, status=status.HTTP_200_OK)


class ApprovalRequestFilters(django_filters.FilterSet):
    approved = ApprovalStateFilter()

    class Meta:
        model = ApprovalRequest
        fields = ["approved"]


class ApprovalRequestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        ApprovalRequest.objects.all()
        # prefetch?
        .select_related(
            "revision",
            "revision__recipe",
        )
    )
    serializer_class = ApprovalRequestSerializer
    permission_classes = [AdminEnabledOrReadOnly, permissions.DjangoModelPermissionsOrAnonReadOnly]
    filterset_class = ApprovalRequestFilters

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


class Filters(views.APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, format=None):
        return Response(
            {
                "status": [
                    {"key": "enabled", "value": "Enabled"},
                    {"key": "disabled", "value": "Disabled"},
                ],
                "channels": [{"key": c.slug, "value": c.name} for c in Channel.objects.all()],
                "countries": [{"key": c.code, "value": c.name} for c in Country.objects.all()],
                "locales": [
                    {"key": locale.code, "value": locale.name} for locale in Locale.objects.all()
                ],
            }
        )


class IdenticonView(views.APIView):
    @api_cache_control(max_age=settings.IMMUTABLE_CACHE_TIME, immutable=True)
    def get(self, request, *, generation, seed):
        if generation != "v1":
            return Response(
                {"error": "Invalid identicon generation, only v1 is supported."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        genome = shield_identicon.Genome(seed)
        identicon_svg = shield_identicon.generate_svg(genome)
        return HttpResponse(identicon_svg, content_type="image/svg+xml")
