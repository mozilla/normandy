import urllib.parse as urlparse
from urllib.parse import urlencode

from django.conf import settings

from rest_framework import serializers

from normandy.base.api.serializers import UserSerializer
from normandy.recipes.api.fields import ActionImplementationHyperlinkField
from normandy.recipes.models import (
    Action,
    ApprovalRequest,
    Channel,
    Country,
    Locale,
    Recipe,
    RecipeRevision,
    Signature
)


class SignatureSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(read_only=True)
    signature = serializers.ReadOnlyField()
    x5u = serializers.SerializerMethodField()
    public_key = serializers.ReadOnlyField()

    class Meta:
        model = Signature
        fields = ['timestamp', 'signature', 'x5u', 'public_key']

    def get_x5u(self, signature):
        x5u = signature.x5u

        # Add cachebust parameter to x5u URL.
        if x5u is not None and settings.AUTOGRAPH_X5U_CACHE_BUST is not None:
            url_parts = list(urlparse.urlparse(x5u))
            query = urlparse.parse_qs(url_parts[4])
            query['cachebust'] = settings.AUTOGRAPH_X5U_CACHE_BUST
            url_parts[4] = urlencode(query)
            return urlparse.urlunparse(url_parts)

        return x5u


class ActionSerializer(serializers.ModelSerializer):
    arguments_schema = serializers.JSONField()
    implementation_url = ActionImplementationHyperlinkField()

    class Meta:
        model = Action
        fields = [
            'name',
            'implementation_url',
            'arguments_schema',
        ]


class SignedActionSerializer(serializers.ModelSerializer):
    signature = SignatureSerializer()
    action = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = ['signature', 'action']

    def get_action(self, action):
        # `action` here is the main object for the serializer.
        return ActionSerializer(action).data


class ApprovalRequestSerializer(serializers.ModelSerializer):
    created = serializers.DateTimeField(read_only=True)
    creator = UserSerializer()
    approver = UserSerializer()

    class Meta:
        model = ApprovalRequest
        fields = [
            'id',
            'created',
            'creator',
            'approved',
            'approver',
            'comment',
        ]


class RecipeSerializer(serializers.ModelSerializer):
    enabled = serializers.BooleanField(read_only=True)
    last_updated = serializers.DateTimeField(read_only=True)
    revision_id = serializers.IntegerField(read_only=True)
    name = serializers.CharField()
    action = serializers.SlugRelatedField(slug_field='name', queryset=Action.objects.all())
    arguments = serializers.JSONField()
    channels = serializers.SlugRelatedField(slug_field='slug', queryset=Channel.objects.all(),
                                            many=True, required=False)
    countries = serializers.SlugRelatedField(slug_field='code', queryset=Country.objects.all(),
                                             many=True, required=False)
    locales = serializers.SlugRelatedField(slug_field='code', queryset=Locale.objects.all(),
                                           many=True, required=False)
    extra_filter_expression = serializers.CharField()
    filter_expression = serializers.CharField(read_only=True)
    latest_revision_id = serializers.IntegerField(source='latest_revision.id', read_only=True)
    approved_revision_id = serializers.IntegerField(source='approved_revision.id', default=None,
                                                    read_only=True)
    approval_request = ApprovalRequestSerializer(read_only=True)
    identicon_seed = serializers.CharField(required=False)

    class Meta:
        model = Recipe
        fields = [
            'id',
            'last_updated',
            'name',
            'enabled',
            'is_approved',
            'revision_id',
            'action',
            'arguments',
            'channels',
            'countries',
            'locales',
            'extra_filter_expression',
            'filter_expression',
            'latest_revision_id',
            'approved_revision_id',
            'approval_request',
            'identicon_seed',
        ]


class MinimalRecipeSerializer(RecipeSerializer):
    """
    The minimum amount of fields needed for clients to verify and execute recipes.
    """

    revision_id = serializers.SerializerMethodField()

    class Meta(RecipeSerializer.Meta):
        # Attributes serialized here are made available to filter expressions via
        # normandy.recipe, and should be documented if they are intended to be
        # used in filter expressions.
        fields = [
            'id',
            'last_updated',
            'name',
            'enabled',
            'is_approved',
            'revision_id',
            'action',
            'arguments',
            'filter_expression',
        ]

    def get_revision_id(self, recipe):
        # Certain parts of Telemetry expect this to be a string, so coerce it to
        # that, even though the data is actually an int
        if recipe.current_revision:
            return str(recipe.current_revision.id)
        else:
            None


class RecipeRevisionSerializer(serializers.ModelSerializer):
    date_created = serializers.DateTimeField(source='created', read_only=True)
    recipe = RecipeSerializer(source='serializable_recipe', read_only=True)
    comment = serializers.CharField(read_only=True)
    approval_request = ApprovalRequestSerializer(read_only=True)

    class Meta:
        model = RecipeRevision
        fields = [
            'id',
            'date_created',
            'recipe',
            'comment',
            'approval_request',
        ]


class ClientSerializer(serializers.Serializer):
    country = serializers.CharField()
    request_time = serializers.DateTimeField()


class SignedRecipeSerializer(serializers.ModelSerializer):
    signature = SignatureSerializer()
    recipe = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = ['signature', 'recipe']

    def get_recipe(self, recipe):
        # `recipe` here is the main object for the serializer.
        return MinimalRecipeSerializer(recipe).data
