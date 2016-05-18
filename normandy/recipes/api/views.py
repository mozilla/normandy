from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.http import Http404
from django.views.decorators.cache import cache_control

from rest_framework import generics, permissions, status, views, viewsets
from rest_framework.decorators import detail_route
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from reversion import revisions as reversion
from reversion.models import Version

from normandy.base.api.permissions import AdminEnabledOrReadOnly
from normandy.base.api.renderers import JavaScriptRenderer
from normandy.recipes.models import Action, Client, Recipe
from normandy.recipes.api.permissions import NotInUse
from normandy.recipes.api.serializers import (
    ActionSerializer,
    ClientSerializer,
    RecipeSerializer,
    RecipeVersionSerializer,
)


class ActionViewSet(viewsets.ModelViewSet):
    """Viewset for viewing and uploading recipe actions."""
    queryset = Action.objects.all()
    serializer_class = ActionSerializer
    permission_classes = [
        permissions.DjangoModelPermissionsOrAnonReadOnly,
        NotInUse,
        AdminEnabledOrReadOnly,
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

        headers = {}

        if action.signature:
            headers['Content-Signature'] = action.signature

        return Response(action.implementation, headers=headers)


class RecipeViewSet(viewsets.ModelViewSet):
    """Viewset for viewing and uploading recipes."""
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer
    filter_fields = ('action', 'enabled')
    permission_classes = [
        permissions.DjangoModelPermissionsOrAnonReadOnly,
        AdminEnabledOrReadOnly,
    ]

    @transaction.atomic()
    @reversion.create_revision()
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """
        Intercept PUT requests and have them create instead of update
        if the object does not exist.
        """
        if request.method in ['PUT', 'PATCH']:
            try:
                recipe = self.get_object()
            except Http404:
                if request.method == 'PUT':
                    with transaction.atomic(), reversion.create_revision():
                        return self.create(request, *args, **kwargs)
            else:
                if recipe.is_approved:
                    recipe.disable(ignore_revision_id=True)

        with transaction.atomic(), reversion.create_revision():
            return super().update(request, *args, **kwargs)

    @detail_route(methods=['GET'])
    def history(self, request, pk=None):
        recipe = self.get_object()
        content_type = ContentType.objects.get_for_model(recipe)
        versions = Version.objects.filter(content_type=content_type, object_id=recipe.pk)
        serializer = RecipeVersionSerializer(versions, many=True, context={'request': request})
        return Response(serializer.data)

    @transaction.atomic()
    @reversion.create_revision()
    @detail_route(methods=['POST'])
    def approve(self, request, pk=None):
        recipe = self.get_object()

        if recipe.is_approved:
            return Response({'approver': 'This recipe is already approved.'},
                            status=status.HTTP_400_BAD_REQUEST)
        recipe.approver = request.user
        recipe.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @transaction.atomic()
    @reversion.create_revision()
    @detail_route(methods=['POST'])
    def enable(self, request, pk=None):
        recipe = self.get_object()

        try:
            recipe.enable()
        except recipe.IsNotApproved:
            return Response({'is_approved': 'This recipe cannot be enabled until it is approved.'},
                            status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(status=status.HTTP_204_NO_CONTENT)

    @transaction.atomic()
    @reversion.create_revision()
    @detail_route(methods=['POST'])
    def disable(self, request, pk=None):
        recipe = self.get_object()
        recipe.disable()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RecipeVersionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RecipeVersionSerializer
    permission_classes = [
        AdminEnabledOrReadOnly,
    ]

    def get_queryset(self):
        content_type = ContentType.objects.get_for_model(Recipe)
        return Version.objects.filter(content_type=content_type)


class ClassifyClient(views.APIView):
    authentication_classes = []
    permission_classes = []
    serializer_class = ClientSerializer

    def get(self, request, format=None):
        client = Client(request)
        serializer = self.serializer_class(client, context={'request': request})
        return Response(serializer.data)
