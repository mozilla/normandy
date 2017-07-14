from rest_framework import permissions, viewsets

from normandy.base.api.mixins import CachingViewsetMixin
from normandy.base.api.permissions import AdminEnabledOrReadOnly
from normandy.studies.api.v2.serializers import ExtensionSerializer
from normandy.studies.models import Extension


class ExtensionViewSet(CachingViewsetMixin, viewsets.ModelViewSet):
    queryset = Extension.objects.all()
    serializer_class = ExtensionSerializer
    permission_classes = [
        AdminEnabledOrReadOnly,
        permissions.DjangoModelPermissionsOrAnonReadOnly,
    ]
