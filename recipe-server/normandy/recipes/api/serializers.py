from pyjexl import JEXL
from rest_framework import serializers
from reversion.models import Version

from normandy.recipes.api.fields import ActionImplementationHyperlinkField
from normandy.recipes.models import (
    Action,
    Channel,
    Country,
    Locale,
    Recipe,
    RecipeRevision,
    Signature
)
from normandy.recipes.validators import JSONSchemaValidator


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


class RecipeSerializer(serializers.ModelSerializer):
    # Attributes serialized here are made available to filter expressions via
    # normandy.recipe, and should be documented if they are intended to be
    # used in filter expressions.
    enabled = serializers.BooleanField(required=False)
    last_updated = serializers.DateTimeField(read_only=True)
    revision_id = serializers.CharField(source='latest_revision.id', read_only=True)
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

    class Meta:
        model = Recipe
        fields = [
            'id',
            'last_updated',
            'name',
            'enabled',
            'revision_id',
            'action',
            'arguments',
            'channels',
            'countries',
            'locales',
            'extra_filter_expression',
            'filter_expression',
        ]

    def update(self, instance, validated_data):
        if 'enabled' in validated_data:
            instance.enabled = validated_data.pop('enabled')

        instance.save()

        if 'action' in validated_data:
            validated_data.update({
                'action': Action.objects.get(name=validated_data['action'])
            })

        if 'channels' in validated_data:
            validated_data.update({
                'channels': Channel.objects.filter(slug__in=validated_data['channels'])
            })

        if 'countries' in validated_data:
            validated_data.update({
                'countries': Country.objects.filter(code__in=validated_data['countries'])
            })

        if 'locales' in validated_data:
            validated_data.update({
                'locales': Locale.objects.filter(code__in=validated_data['locales'])
            })

        instance.update(**validated_data)

        return instance

    def create(self, validated_data):
        recipe = Recipe.objects.create(enabled=validated_data.pop('enabled', False))
        recipe.save()

        return self.update(recipe, validated_data)

    def validate_extra_filter_expression(self, value):
        jexl = JEXL()

        # Add mock transforms for validation. See
        # http://normandy.readthedocs.io/en/latest/user/filter_expressions.html#transforms
        # for a list of what transforms we expect to be available.
        jexl.add_transform('date', lambda x: x)
        jexl.add_transform('stableSample', lambda x: x)
        jexl.add_transform('bucketSample', lambda x: x)

        errors = list(jexl.validate(value))
        if errors:
            raise serializers.ValidationError(errors)

        return value

    def validate_arguments(self, value):
        # Get the schema associated with the selected action
        try:
            schema = Action.objects.get(name=self.initial_data.get('action')).arguments_schema
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


class ClientSerializer(serializers.Serializer):
    country = serializers.CharField()
    request_time = serializers.DateTimeField()


class RecipeRevisionSerializer(serializers.ModelSerializer):
    date_created = serializers.DateTimeField(source='created', read_only=True)
    comment = serializers.CharField(read_only=True)
    recipe = RecipeSerializer(source='restored_recipe', read_only=True)

    class Meta:
        model = RecipeRevision
        fields = [
            'id',
            'date_created',
            'recipe',
            'comment',
        ]


class RecipeVersionSerializer(serializers.ModelSerializer):
    date_created = serializers.DateTimeField(source='revision.date_created', read_only=True)
    comment = serializers.CharField(source='revision.comment', read_only=True)
    recipe = RecipeSerializer(source='_object_version.object', read_only=True)

    class Meta:
        model = Version
        fields = [
            'id',
            'date_created',
            'recipe',
            'comment',
        ]


class SignatureSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(read_only=True)
    signature = serializers.ReadOnlyField()
    x5u = serializers.ReadOnlyField()
    public_key = serializers.ReadOnlyField()

    class Meta:
        model = Signature
        fields = ['timestamp', 'signature', 'x5u', 'public_key']


class SignedRecipeSerializer(serializers.ModelSerializer):
    signature = SignatureSerializer()
    recipe = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = ['signature', 'recipe']

    def get_recipe(self, recipe):
        return RecipeSerializer(recipe).data
