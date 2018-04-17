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
)
from normandy.recipes.validators import JSONSchemaValidator


class ActionSerializer(serializers.ModelSerializer):
    arguments_schema = serializers.JSONField()
    implementation_url = ActionImplementationHyperlinkField()

    class Meta:
        model = Action
        fields = [
            'arguments_schema',
            'name',
            'id',
            'implementation_url',
        ]


class ApprovalRequestSerializer(serializers.ModelSerializer):
    approver = UserSerializer()
    created = serializers.DateTimeField(read_only=True)
    creator = UserSerializer()

    class Meta:
        model = ApprovalRequest
        fields = [
            'approved',
            'approver',
            'comment',
            'created',
            'creator',
            'id',
        ]


class RecipeRevisionSerializer(serializers.ModelSerializer):
    approval_request = ApprovalRequestSerializer(read_only=True)
    comment = serializers.CharField(read_only=True)
    date_created = serializers.DateTimeField(source='created', read_only=True)
    recipe = serializers.SerializerMethodField(read_only=True)
    user = UserSerializer()

    class Meta:
        model = RecipeRevision
        fields = [
            'approval_request',
            'comment',
            'date_created',
            'id',
            'recipe',
            'user',
            'identicon_seed'
        ]

    def get_recipe(self, instance):
        serializer = RecipeSerializer(instance.serializable_recipe,
                                      exclude_fields=['latest_revision', 'approved_revision',
                                                      'approval_request'])
        return serializer.data


class RecipeSerializer(serializers.ModelSerializer):
    action = serializers.SerializerMethodField(read_only=True)
    action_id = serializers.PrimaryKeyRelatedField(
        source='action', queryset=Action.objects.all(), write_only=True)
    approval_request = ApprovalRequestSerializer(read_only=True)
    approved_revision = RecipeRevisionSerializer(read_only=True)
    arguments = serializers.JSONField()
    channels = serializers.SlugRelatedField(
        slug_field='slug', queryset=Channel.objects.all(), many=True, required=False)
    countries = serializers.SlugRelatedField(
        slug_field='code', queryset=Country.objects.all(), many=True, required=False)
    enabled = serializers.BooleanField(read_only=True)
    extra_filter_expression = serializers.CharField()
    filter_expression = serializers.CharField(read_only=True)
    last_updated = serializers.DateTimeField(read_only=True)
    locales = serializers.SlugRelatedField(
        slug_field='code', queryset=Locale.objects.all(), many=True, required=False)
    latest_revision = RecipeRevisionSerializer(read_only=True)
    name = serializers.CharField()
    identicon_seed = serializers.CharField(required=False)

    class Meta:
        model = Recipe
        fields = [
            'action',
            'action_id',
            'approval_request',
            'approved_revision',
            'arguments',
            'channels',
            'countries',
            'enabled',
            'extra_filter_expression',
            'filter_expression',
            'id',
            'is_approved',
            'locales',
            'last_updated',
            'latest_revision',
            'name',
            'identicon_seed',
        ]

    def __init__(self, *args, **kwargs):
        exclude_fields = kwargs.pop('exclude_fields', [])
        super().__init__(*args, **kwargs)

        if exclude_fields:
            for field in exclude_fields:
                if field in self.fields:
                    self.fields.pop(field)

    def get_action(self, instance):
        serializer = ActionSerializer(
            instance.action, read_only=True, context={'request': self.context.get('request')})
        return serializer.data

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

        try:
            errors = list(jexl.validate(value))
        except Exception as exc:
            # The JEXL parser can occasionally throw exceptions when
            # called to validate certain invalid inputs.
            # Catch them and at least indicate the field that failed,
            # even if we can't explain exactly what the problem was.
            # See https://github.com/mozilla/normandy/issues/1059.
            error = f'The JEXL parser failed to validate {value}'
            raise serializers.ValidationError([error])

        if errors:
            raise serializers.ValidationError(errors)

        return value

    def validate_arguments(self, value):
        # Ensure the value is a dict
        if not isinstance(value, dict):
            raise serializers.ValidationError('Invalid arguments.')

        # Get the schema associated with the selected action
        try:
            schema = Action.objects.get(pk=self.initial_data.get('action_id')).arguments_schema
        except:
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
