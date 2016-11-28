from django.contrib.auth.models import User

from rest_framework import serializers
from reversion.models import Version

from normandy.base.api.serializers import UserSerializer
from normandy.recipes.api.fields import ActionImplementationHyperlinkField
from normandy.recipes.models import (
    Action, Approval, ApprovalRequest, ApprovalRequestComment, Recipe, Signature)
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


class ApprovalSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    creator_id = serializers.PrimaryKeyRelatedField(source='creator', queryset=User.objects.all(),
                                                    write_only=True)

    class Meta:
        model = Approval
        fields = [
            'id',
            'created',
            'creator',
            'creator_id',
        ]


class ApprovalRequestSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    creator_id = serializers.PrimaryKeyRelatedField(source='creator', queryset=User.objects.all(),
                                                    write_only=True)
    is_approved = serializers.BooleanField(read_only=True)
    recipe_id = serializers.PrimaryKeyRelatedField(source='recipe', queryset=Recipe.objects.all(),
                                                   write_only=True)

    class Meta:
        model = ApprovalRequest
        fields = [
            'id',
            'created',
            'creator',
            'creator_id',
            'active',
            'approval',
            'is_approved',
            'recipe_id',
        ]


class ApprovalRequestCommentSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    creator_id = serializers.PrimaryKeyRelatedField(source='creator', queryset=User.objects.all(),
                                                    write_only=True)
    approval_request_id = serializers.PrimaryKeyRelatedField(
        source='approval_request', queryset=ApprovalRequest.objects.all(), write_only=True)

    class Meta:
        model = ApprovalRequestComment
        fields = [
            'id',
            'created',
            'creator',
            'creator_id',
            'text',
            'approval_request_id',
        ]


class RecipeSerializer(serializers.ModelSerializer):
    action = serializers.SlugRelatedField(slug_field='name', queryset=Action.objects.all())
    arguments = serializers.JSONField()
    current_approval_request = ApprovalRequestSerializer(read_only=True)
    approval = ApprovalSerializer(read_only=True)
    is_approved = serializers.BooleanField(read_only=True)
    enabled = serializers.BooleanField(required=False)

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
            'filter_expression',
            'current_approval_request',
            'approval',
            'is_approved',
        ]

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
