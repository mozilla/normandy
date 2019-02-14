from rest_framework import mixins, status, viewsets
from rest_framework.response import Response

from normandy.base.api.filters import AliasedOrderingFilter
from normandy.base.api.mixins import CachingViewsetMixin
from normandy.studies.api.v1.serializers import ExtensionSerializer
from normandy.studies.models import Extension


class ExtensionOrderingFilter(AliasedOrderingFilter):
    aliases = {"id": ("id", "ID"), "name": ("name", "Name")}


class ExtensionViewSet(CachingViewsetMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = Extension.objects.all()
    serializer_class = ExtensionSerializer

    def list(self, *args, **kwargs):
        return Response(status=status.HTTP_204_NO_CONTENT)
