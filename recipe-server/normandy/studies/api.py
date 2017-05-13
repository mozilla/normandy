from rest_framework import permissions, serializers, viewsets

from normandy.base.api.mixins import CachingViewsetMixin
from normandy.base.api.permissions import AdminEnabledOrReadOnly
from normandy.studies.models import Extension


class ExtensionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Extension
        fields = [
            'name',
            'xpi',
        ]


class ExtensionViewSet(CachingViewsetMixin, viewsets.ModelViewSet):
    queryset = Extension.objects.all()
    serializer_class = ExtensionSerializer
    permission_classes = [
        AdminEnabledOrReadOnly,
        permissions.DjangoModelPermissionsOrAnonReadOnly,
    ]
