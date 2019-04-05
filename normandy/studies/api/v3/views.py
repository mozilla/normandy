from django.db.models import Q

from rest_framework import permissions, viewsets
from rest_framework.views import Response, status

from normandy.base.api.filters import AliasedOrderingFilter
from normandy.base.api.mixins import CachingViewsetMixin
from normandy.base.api.permissions import AdminEnabledOrReadOnly
from normandy.recipes.models import RecipeRevision
from normandy.studies.api.v3.serializers import ExtensionSerializer
from normandy.studies.models import Extension


class ExtensionOrderingFilter(AliasedOrderingFilter):
    aliases = {"id": ("id", "ID"), "name": ("name", "Name")}


class ExtensionViewSet(CachingViewsetMixin, viewsets.ModelViewSet):
    queryset = Extension.objects.all()
    serializer_class = ExtensionSerializer
    permission_classes = [AdminEnabledOrReadOnly, permissions.DjangoModelPermissionsOrAnonReadOnly]
    filter_backends = [ExtensionOrderingFilter]

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except FileExistsError:
            return Response(
                {"xpi": "An extension with this filename already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except FileExistsError:
            return Response(
                {"xpi": "An extension with this filename already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def get_queryset(self):
        queryset = super().get_queryset()

        if "text" in self.request.GET:
            text = self.request.GET.get("text")
            queryset = queryset.filter(Q(name__icontains=text) | Q(xpi__icontains=text))

        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        revisions = RecipeRevision.objects.filter(action__name="opt-out-study").exclude(
            latest_for_recipe=None, approved_for_recipe=None
        )

        for r in revisions:
            if r.arguments.get("extensionId") == instance.id:
                return Response(
                    ["Extension cannot be updated while in use by a recipe."],
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return super().destroy(request, *args, **kwargs)
