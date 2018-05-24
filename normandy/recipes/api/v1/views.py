from django.conf import settings
from django.db import transaction
from django.db.models import Q

import django_filters
from rest_framework import generics, permissions, views, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

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
from normandy.recipes.api.filters import EnabledStateFilter
from normandy.recipes.api.v1.serializers import (
    ActionSerializer,
    ApprovalRequestSerializer,
    ClientSerializer,
    RecipeRevisionSerializer,
    RecipeSerializer,
    SignedActionSerializer,
    SignedRecipeSerializer,
)


class ActionViewSet(CachingViewsetMixin, viewsets.ReadOnlyModelViewSet):
    """Viewset for viewing recipe actions."""
    queryset = Action.objects.all()
    serializer_class = ActionSerializer
    pagination_class = None

    lookup_field = 'name'
    lookup_value_regex = r'[_\-\w]+'

    @action(detail=False, methods=['GET'])
    @api_cache_control()
    def signed(self, request, pk=None):
        actions = self.filter_queryset(self.get_queryset()).exclude(signature=None)
        serializer = SignedActionSerializer(actions, many=True)
        return Response(serializer.data)


class ActionImplementationView(generics.RetrieveAPIView):
    """
    Retrieves the implementation code for an action. Raises a 404 if the
    given hash doesn't match the hash we've stored.
    """
    queryset = Action.objects.all()
    lookup_field = 'name'

    permission_classes = []
    renderer_classes = [JavaScriptRenderer]
    pagination_class = None

    @api_cache_control(max_age=settings.IMMUTABLE_CACHE_TIME)
    def retrieve(self, request, name, impl_hash):
        action = self.get_object()
        if impl_hash != action.implementation_hash:
            raise NotFound('Hash does not match current stored action.')

        return Response(action.implementation)


class RecipeFilters(django_filters.FilterSet):
    enabled = EnabledStateFilter()
    action = django_filters.CharFilter(field_name='latest_revision__action__name')

    class Meta:
        model = Recipe
        fields = [
            'action',
            'enabled',
            'latest_revision__action',
        ]


class RecipeViewSet(CachingViewsetMixin, viewsets.ReadOnlyModelViewSet):
    """Viewset for viewing and uploading recipes."""
    queryset = (
        Recipe.objects.all()
        # Foreign keys
        .select_related('latest_revision')
        .select_related('latest_revision__action')
        .select_related('latest_revision__approval_request')
        # Many-to-many
        .prefetch_related('latest_revision__channels')
        .prefetch_related('latest_revision__countries')
        .prefetch_related('latest_revision__locales')
    )
    serializer_class = RecipeSerializer
    filter_class = RecipeFilters
    permission_classes = [
        permissions.DjangoModelPermissionsOrAnonReadOnly,
        AdminEnabledOrReadOnly,
    ]
    pagination_class = None

    def get_queryset(self):
        queryset = self.queryset

        if self.request.GET.get('status') == 'enabled':
            queryset = queryset.only_enabled()
        elif self.request.GET.get('status') == 'disabled':
            queryset = queryset.only_disabled()

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

    @action(detail=False, methods=['GET'])
    @api_cache_control()
    def signed(self, request, pk=None):
        recipes = self.filter_queryset(self.get_queryset()).exclude(signature=None)
        serializer = SignedRecipeSerializer(recipes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['GET'])
    @api_cache_control()
    def history(self, request, pk=None):
        recipe = self.get_object()
        serializer = RecipeRevisionSerializer(recipe.revisions.all(), many=True,
                                              context={'request': request})
        return Response(serializer.data)


class RecipeRevisionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        RecipeRevision.objects.all()
        .select_related('action')
        .select_related('approval_request')
        .select_related('recipe')
        # Many-to-many
        .prefetch_related('channels')
        .prefetch_related('countries')
        .prefetch_related('locales')
    )
    serializer_class = RecipeRevisionSerializer
    permission_classes = [
        AdminEnabledOrReadOnly,
        permissions.DjangoModelPermissionsOrAnonReadOnly,
    ]
    pagination_class = None


class ApprovalRequestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ApprovalRequest.objects.all()
    serializer_class = ApprovalRequestSerializer
    permission_classes = [
        AdminEnabledOrReadOnly,
        permissions.DjangoModelPermissionsOrAnonReadOnly,
    ]
    pagination_class = None


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
