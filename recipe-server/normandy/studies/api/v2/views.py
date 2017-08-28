from django.db.models import Q

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

    def get_queryset(self):
        queryset = self.queryset

        if 'text' in self.request.GET:
            text = self.request.GET.get('text')
            queryset = queryset.filter(Q(name__icontains=text) |
                                       Q(xpi__icontains=text))

        return queryset
