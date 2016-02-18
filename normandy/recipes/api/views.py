from django.http import Http404

from rest_framework import permissions, viewsets
from rest_framework.decorators import detail_route
from rest_framework.response import Response

from normandy.base.api.permissions import AdminEnabled
from normandy.base.api.renders import JavaScriptRenderer
from normandy.recipes.models import Action
from normandy.recipes.api.permissions import NotInUse
from normandy.recipes.api.serializers import ActionSerializer


class ActionViewSet(viewsets.ModelViewSet):
    """Viewset for viewing and uploading recipe actions."""
    queryset = Action.objects.all()
    serializer_class = ActionSerializer
    permission_classes = [
        permissions.DjangoModelPermissions,
        NotInUse,
        AdminEnabled,
    ]

    lookup_field = 'name'
    lookup_value_regex = r'[_\-\w]+'

    def update(self, request, *args, **kwargs):
        """
        Intercept PUT requests and have them create instead of update
        if the object does not exist.
        """
        if request.method == 'PUT':
            try:
                self.get_object()
            except Http404:
                return self.create(request, *args, **kwargs)

        return super().update(request, *args, **kwargs)

    @detail_route(permission_classes=[], renderer_classes=[JavaScriptRenderer])
    def implementation(self, request, name=None):
        obj = self.get_object()
        return Response(obj.implementation)
