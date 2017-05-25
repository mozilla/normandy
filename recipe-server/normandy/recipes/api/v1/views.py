from django.conf import settings
from django.db import transaction
from django.db.models import Q

import django_filters
from rest_framework import generics, permissions, status, views, viewsets
from rest_framework.decorators import detail_route, list_route
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from normandy.base.api import UpdateOrCreateModelViewSet
from normandy.base.api.filters import CaseInsensitiveBooleanFilter
from normandy.base.api.mixins import CachingViewsetMixin
from normandy.base.api.permissions import AdminEnabledOrReadOnly
from normandy.base.api.renderers import JavaScriptRenderer
from normandy.base.decorators import api_cache_control
from normandy.recipes.models import (
    Action,
    ApprovalRequest,
    Channel,
    Client,
    Country,
    Locale,
    Recipe,
    RecipeRevision
)
from normandy.recipes.api.v1.serializers import (
    ActionSerializer,
    ApprovalRequestSerializer,
    ClientSerializer,
    RecipeSerializer,
    RecipeRevisionSerializer,
    SignedRecipeSerializer,
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

    @api_cache_control(max_age=settings.ACTION_IMPLEMENTATION_CACHE_TIME)
    def retrieve(self, request, name, impl_hash):
        action = self.get_object()
        if impl_hash != action.implementation_hash:
            raise NotFound('Hash does not match current stored action.')

        return Response(action.implementation)


class RecipeFilters(django_filters.FilterSet):
    enabled = CaseInsensitiveBooleanFilter(name='enabled', lookup_expr='eq')

    class Meta:
        model = Recipe
        fields = ['latest_revision__action', 'enabled']


class RecipeViewSet(CachingViewsetMixin, UpdateOrCreateModelViewSet):
    """Viewset for viewing and uploading recipes."""
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer
    filter_class = RecipeFilters
    permission_classes = [
        permissions.DjangoModelPermissionsOrAnonReadOnly,
        AdminEnabledOrReadOnly,
    ]

    def get_queryset(self):
        queryset = self.queryset

        if self.request.GET.get('status') == 'enabled':
            queryset = queryset.filter(enabled=True)
        elif self.request.GET.get('status') == 'disabled':
            queryset = queryset.filter(enabled=False)

        if 'channels' in self.request.GET:
            channels = self.request.GET.get('channels').split(',')
            queryset = queryset.filter(latest_revision__channels__slug__in=channels)

        if 'countries' in self.request.GET:
            countries = self.request.GET.get('countries').split(',')
            queryset = queryset.filter(latest_revision__countries__code__in=countries)

        if 'locales' in self.request.GET:
            locales = self.request.GET.get('locales').split(',')
            queryset = queryset.filter(latest_revision__locales__code__in=locales)

        if 'text' in self.request.GET:
            text = self.request.GET.get('text')
            queryset = queryset.filter(Q(latest_revision__name__contains=text) |
                                       Q(latest_revision__extra_filter_expression__contains=text))

        return queryset

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @list_route(methods=['GET'])
    @api_cache_control()
    def signed(self, request, pk=None):
        recipes = self.filter_queryset(self.get_queryset()).exclude(signature=None)
        serializer = SignedRecipeSerializer(recipes, many=True)
        return Response(serializer.data)

    @detail_route(methods=['GET'])
    @api_cache_control()
    def history(self, request, pk=None):
        recipe = self.get_object()
        serializer = RecipeRevisionSerializer(recipe.revisions.all(), many=True,
                                              context={'request': request})
        return Response(serializer.data)

    @detail_route(methods=['POST'])
    def enable(self, request, pk=None):
        recipe = self.get_object()
        recipe.enabled = True

        try:
            recipe.save()
        except Recipe.NotApproved as e:
            return Response({'enabled': str(e)}, status=status.HTTP_409_CONFLICT)

        return Response(RecipeSerializer(recipe).data)

    @detail_route(methods=['POST'])
    def disable(self, request, pk=None):
        recipe = self.get_object()
        recipe.enabled = False
        recipe.save()
        return Response(RecipeSerializer(recipe).data)


class RecipeRevisionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RecipeRevision.objects.all()
    serializer_class = RecipeRevisionSerializer
    permission_classes = [
        AdminEnabledOrReadOnly,
        permissions.DjangoModelPermissionsOrAnonReadOnly,
    ]

    @detail_route(methods=['POST'])
    def request_approval(self, request, pk=None):
        revision = self.get_object()

        if revision.approval_status is not None:
            return Response({'error': 'This revision already has an approval request.'},
                            status=status.HTTP_400_BAD_REQUEST)

        approval_request = revision.request_approval(creator=request.user)

        return Response(ApprovalRequestSerializer(approval_request).data,
                        status=status.HTTP_201_CREATED)


class ApprovalRequestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ApprovalRequest.objects.all()
    serializer_class = ApprovalRequestSerializer
    permission_classes = [
        AdminEnabledOrReadOnly,
        permissions.DjangoModelPermissionsOrAnonReadOnly,
    ]

    @detail_route(methods=['POST'])
    def approve(self, request, pk=None):
        approval_request = self.get_object()

        if 'comment' not in request.data:
            return Response({'comment': 'This field is required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            approval_request.approve(approver=request.user, comment=request.data.get('comment'))
        except ApprovalRequest.NotActionable:
            return Response(
                {'error': 'This approval request has already been approved or rejected.'},
                status=status.HTTP_400_BAD_REQUEST)
        except ApprovalRequest.CannotActOnOwnRequest:
            return Response(
                {'error': 'You cannot approve your own approval request.'},
                status=status.HTTP_403_FORBIDDEN)

        return Response(ApprovalRequestSerializer(approval_request).data)

    @detail_route(methods=['POST'])
    def reject(self, request, pk=None):
        approval_request = self.get_object()

        if 'comment' not in request.data:
            return Response({'comment': 'This field is required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            approval_request.reject(approver=request.user, comment=request.data.get('comment'))
        except ApprovalRequest.NotActionable:
            return Response(
                {'error': 'This approval request has already been approved or rejected.'},
                status=status.HTTP_400_BAD_REQUEST)
        except ApprovalRequest.CannotActOnOwnRequest:
            return Response(
                {'error': 'You cannot reject your own approval request.'},
                status=status.HTTP_403_FORBIDDEN)

        return Response(ApprovalRequestSerializer(approval_request).data)

    @detail_route(methods=['POST'])
    def close(self, request, pk=None):
        approval_request = self.get_object()
        approval_request.close()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ClassifyClient(views.APIView):
    authentication_classes = []
    permission_classes = []
    serializer_class = ClientSerializer

    def get(self, request, format=None):
        client = Client(request)
        serializer = self.serializer_class(client, context={'request': request})
        return Response(serializer.data)


class Filters(views.APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, format=None):
        return Response({
            'status': [
                {
                    'key': 'enabled',
                    'value': 'Enabled',
                },
                {
                    'key': 'disabled',
                    'value': 'Disabled',
                },
            ],
            'channels': [
                {'key': c.slug, 'value': c.name} for c in Channel.objects.all()
            ],
            'countries': [
                {'key': c.code, 'value': c.name} for c in Country.objects.all()
            ],
            'locales': [
                {'key': l.code, 'value': l.name} for l in Locale.objects.all()
            ],
        })
