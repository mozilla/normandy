import urllib.parse as urlparse
from urllib.parse import urlencode

from django.conf import settings

from pyjexl import JEXL
from rest_framework import serializers
from factory.fuzzy import FuzzyText

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
from normandy.recipes.validators import JSONSchemaValidator


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
    revision_id = serializers.CharField(read_only=True)
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
    latest_revision_id = serializers.CharField(source='latest_revision.id', read_only=True)
    approved_revision_id = serializers.CharField(source='approved_revision.id', read_only=True)
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

    def update(self, instance, validated_data):
        instance.revise(**validated_data)
        return instance

    def create(self, validated_data):
        if 'identicon_seed' not in validated_data:
            validated_data['identicon_seed'] = f'v1:{FuzzyText().fuzz()}'

        recipe = Recipe.objects.create()
        return self.update(recipe, validated_data)

    def validate_extra_filter_expression(self, value):
        jexl = JEXL()

        # Add mock transforms for validation. See
        # http://normandy.readthedocs.io/en/latest/user/filter_expressions.html#transforms
        # for a list of what transforms we expect to be available.
        jexl.add_transform('date', lambda x: x)
        jexl.add_transform('stableSample', lambda x: x)
        jexl.add_transform('bucketSample', lambda x: x)
        jexl.add_transform('preferenceValue', lambda x: x)
        jexl.add_transform('preferenceIsUserSet', lambda x: x)
        jexl.add_transform('preferenceExists', lambda x: x)

        errors = list(jexl.validate(value))
        if errors:
            raise serializers.ValidationError(errors)

        return value

    def validate_arguments(self, value):
        # This in an invariance validation. It depends on the action_id
        # being valid.
        action_id = self.initial_data.get('action')
        if not action_id:
            # If this is the case, it will be caught by the basic
            # validation.
            return

        # Ensure the value is a dict
        if not isinstance(value, dict):
            raise serializers.ValidationError('Must be an object.')

        # Get the schema associated with the selected action
        try:
            schema = Action.objects.get(name=action_id).arguments_schema
        except Action.DoesNotExist:
            raise serializers.ValidationError('Could not find arguments schema.')

        schemaValidator = JSONSchemaValidator(schema)
        errorResponse = {}
        errors = sorted(schemaValidator.iter_errors(value), key=lambda e: e.path)

        # Loop through ValidationErrors returned by JSONSchema
        # Each error contains a message and a path attribute
        # message: string human-readable error explanation
        # path: list containing path to offending element
        for error in errors:
            currentLevel = errorResponse

            # Loop through the path of the current error
            # e.g. ['surveys'][0]['weight']
            for index, path in enumerate(error.path):
                # If this key already exists in our error response, step into it
                if path in currentLevel:
                    currentLevel = currentLevel[path]
                    continue
                else:
                    # If we haven't reached the end of the path, add this path
                    # as a key in our error response object and step into it
                    if index < len(error.path) - 1:
                        currentLevel[path] = {}
                        currentLevel = currentLevel[path]
                        continue
                    # If we've reached the final path, set the error message
                    else:
                        currentLevel[path] = error.message

        if (errorResponse):
            raise serializers.ValidationError(errorResponse)

        return value


class MinimalRecipeSerializer(RecipeSerializer):
    """
    The minimum amount of fields needed for clients to verify and execute recipes.
    """

    revision_id = serializers.CharField(source='current_revision.id', read_only=True)

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
            'revision_id',
        ]


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
