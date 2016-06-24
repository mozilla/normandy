from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.views.decorators.cache import cache_control

import django_filters
from rest_framework import generics, permissions, status, views, viewsets
from rest_framework.decorators import detail_route
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from reversion.models import Version

from normandy.base.api import UpdateOrCreateModelViewSet
from normandy.base.api.filters import CaseInsensitiveBooleanFilter
from normandy.base.api.mixins import CachingViewsetMixin, MidairCollisionViewsetMixin
from normandy.base.api.permissions import AdminEnabledOrReadOnly
from normandy.base.api.renderers import JavaScriptRenderer
from normandy.base.decorators import reversion_transaction
from normandy.recipes.models import Action, Client, Recipe, ApprovalRequest, ApprovalRequestComment
from normandy.recipes.api.serializers import (
    ActionSerializer,
    ClientSerializer,
    RecipeSerializer,
    RecipeVersionSerializer,
    ApprovalRequestSerializer,
    ApprovalRequestCommentSerializer,
)


class ActionViewSet(CachingViewsetMixin, viewsets.ReadOnlyModelViewSet):
    """Viewset for viewing recipe actions."""
    queryset = Action.objects.all()
    serializer_class = ActionSerializer

    lookup_field = 'name'
    lookup_value_regex = r'[_\-\w]+'


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


class RecipeFilters(django_filters.FilterSet):
    enabled = CaseInsensitiveBooleanFilter(name='enabled', lookup_type='eq')

    class Meta:
        model = Recipe
        fields = ['action', 'enabled']


class RecipeViewSet(MidairCollisionViewsetMixin, CachingViewsetMixin, UpdateOrCreateModelViewSet):
    """Viewset for viewing and uploading recipes."""
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer
    filter_class = RecipeFilters
    permission_classes = [
        permissions.DjangoModelPermissionsOrAnonReadOnly,
        AdminEnabledOrReadOnly,
    ]

    def handle_exception(self, exc):
        if isinstance(exc, Recipe.IsNotApproved):
            return Response({'is_approved': 'This recipe cannot be enabled until it is approved.'},
                            status=status.HTTP_400_BAD_REQUEST)

        return super().handle_exception(exc)

    @reversion_transaction
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @reversion_transaction
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @detail_route(methods=['GET'])
    def history(self, request, pk=None):
        recipe = self.get_object()
        content_type = ContentType.objects.get_for_model(recipe)
        versions = Version.objects.filter(content_type=content_type, object_id=recipe.pk)
        serializer = RecipeVersionSerializer(versions, many=True, context={'request': request})
        return Response(serializer.data)

    @reversion_transaction
    @detail_route(methods=['POST'])
    def enable(self, request, pk=None):
        recipe = self.get_object()
        recipe.enable()
        recipe.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @reversion_transaction
    @detail_route(methods=['POST'])
    def disable(self, request, pk=None):
        recipe = self.get_object()
        recipe.disable()
        recipe.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @detail_route(methods=['GET'])
    def approval_requests(self, request, pk=None):
        recipe = self.get_object()
        serializer = ApprovalRequestSerializer(recipe.approval_requests, many=True)
        return Response(serializer.data)


class ApprovalRequestViewSet(MidairCollisionViewsetMixin, UpdateOrCreateModelViewSet):
    queryset = ApprovalRequest.objects.all()
    serializer_class = ApprovalRequestSerializer
    filter_fields = ('active',)
    permission_classes = [
        permissions.DjangoModelPermissionsOrAnonReadOnly,
        AdminEnabledOrReadOnly,
    ]

    def handle_exception(self, exc):
        if isinstance(exc, ApprovalRequest.ActiveRequestAlreadyExists):
            return Response(
                {'active': 'You can only have one open approval request for a recipe.'},
                status=status.HTTP_400_BAD_REQUEST)
        elif isinstance(exc, ApprovalRequest.IsNotActive):
            return Response({'active': 'This approval request has already been closed.'},
                            status=status.HTTP_400_BAD_REQUEST)

        return super().handle_exception(exc)

    @reversion_transaction
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @reversion_transaction
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @reversion_transaction
    @detail_route(methods=['POST'])
    def approve(self, request, pk=None):
        approval_request = self.get_object()
        approval_request.approve(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @detail_route(methods=['POST'])
    def reject(self, request, pk=None):
        approval_request = self.get_object()
        approval_request.reject()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @detail_route(methods=['POST'])
    def comment(self, request, pk=None):
        approval_request = self.get_object()

        data = request.data
        data.update({'creator_id': request.user.id,
                     'approval_request_id': approval_request.id})
        serializer = ApprovalRequestCommentSerializer(data=data)

        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(serializer.data)

    @detail_route(methods=['GET'])
    def comments(self, request, pk=None):
        approval_request = self.get_object()
        serializer = ApprovalRequestCommentSerializer(approval_request.comments, many=True)
        return Response(serializer.data)


class ApprovalRequestCommentViewSet(MidairCollisionViewsetMixin, UpdateOrCreateModelViewSet):
    queryset = ApprovalRequestComment.objects.all()
    serializer_class = ApprovalRequestCommentSerializer
    permission_classes = [
        permissions.DjangoModelPermissionsOrAnonReadOnly,
        AdminEnabledOrReadOnly,
    ]


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
