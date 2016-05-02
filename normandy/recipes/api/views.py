from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.http import Http404
from django.views.decorators.cache import cache_control

from rest_framework import generics, permissions, viewsets, views
from rest_framework.decorators import detail_route
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from reversion import revisions as reversion
from reversion.models import Version

from normandy.base.api.permissions import AdminEnabled
from normandy.base.api.renderers import JavaScriptRenderer
from normandy.base.decorators import short_circuit_middlewares
from normandy.recipes.models import Action, Bundle, Client, Recipe
from normandy.recipes.api.permissions import NotInUse
from normandy.recipes.api.serializers import (
    ActionSerializer,
    BundleSerializer,
    RecipeSerializer,
    RecipeVersionSerializer,
)


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

    @transaction.atomic()
    @reversion.create_revision()
    def create(self, *args, **kwargs):
        return super().create(*args, **kwargs)

    @transaction.atomic()
    @reversion.create_revision()
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


class RecipeViewSet(viewsets.ModelViewSet):
    """Viewset for viewing and uploading recipes."""
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer
    permission_classes = [
        permissions.DjangoModelPermissions,
        AdminEnabled,
    ]

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

    @detail_route(methods=['GET',])
    def history(self, request, pk=None):
        recipe = self.get_object()
        content_type = ContentType.objects.get_for_model(recipe)
        versions = Version.objects.filter(content_type=content_type, object_id=recipe.pk)
        data = [RecipeVersionSerializer(v, context={'request': request}).data for v in versions]
        return Response(data)


class FetchBundle(views.APIView):
    authentication_classes = []
    permission_classes = []
    serializer_class = BundleSerializer

    @classmethod
    def as_view(cls, **initkwargs):
        view = super().as_view(**initkwargs)
        # Apply the short circuit middleware
        return short_circuit_middlewares(view)

    def post(self, request, format=None):
        """
        Determine the recipes that matches the requesting client.
        """
        client = Client(request)
        bundle = Bundle.for_client(client)
        serializer = self.serializer_class(bundle, context={'request': request})
        return Response(serializer.data)
