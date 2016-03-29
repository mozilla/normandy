from django.conf import settings
from django.http import Http404
from django.views.decorators.cache import cache_control

from rest_framework import generics, permissions, viewsets
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from normandy.base.api.permissions import AdminEnabled
from normandy.base.api.renderers import JavaScriptRenderer
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


class ActionImplementationView(generics.RetrieveAPIView):
    """
    Retrieves the implementation code for an action. Raises a 404 if the
    given hash doesn't match the hash we've stored.
    """
    queryset = Action.objects.all()
    lookup_field = 'name'

    permission_classes = []
    renderer_classes = [JavaScriptRenderer]

    @cache_control(public=True, max_age=settings.ACTION_IMPLEMENTATION_CACHE_TIME)
    def retrieve(self, request, name, impl_hash):
        action = self.get_object()
        if impl_hash != action.implementation_hash:
            raise NotFound('Hash does not match current stored action.')

        return Response(action.implementation)
