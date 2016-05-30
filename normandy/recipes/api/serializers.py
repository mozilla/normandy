from django.contrib.auth.models import User

from rest_framework import serializers
from reversion.models import Version

from normandy.base.api.serializers import UserSerializer
from normandy.recipes.api.fields import ActionImplementationHyperlinkField
from normandy.recipes.models import (Action, Recipe, Approval, ApprovalRequest,
                                     ApprovalRequestComment)


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
    action_name = serializers.CharField(source='action.name')
    arguments = serializers.JSONField()
    current_approval_request = ApprovalRequestSerializer(read_only=True)
    approval = ApprovalSerializer(read_only=True)
    is_approved = serializers.BooleanField(read_only=True)
    enabled = serializers.BooleanField(read_only=True)

    class Meta:
        model = Recipe
        fields = [
            'id',
            'name',
            'enabled',
            'revision_id',
            'action_name',
            'arguments',
            'filter_expression',
            'current_approval_request',
            'approval',
            'is_approved',
        ]

    def validate_action_name(self, attr):
        try:
            Action.objects.get(name=attr)
        except Action.DoesNotExist:
            raise serializers.ValidationError('Action does not exist.')
        return attr

    def create(self, validated_data):
        action_name = validated_data.pop('action')['name']
        action = Action.objects.get(name=action_name)
        recipe = Recipe.objects.create(action=action, **validated_data)
        return recipe

    def update(self, instance, validated_data):
        instance.name = validated_data.get('name', instance.name)
        instance.arguments = validated_data.get('arguments', instance.arguments)

        if 'action' in validated_data:
            action_name = validated_data.pop('action')['name']
            instance.action = Action.objects.get(name=action_name)

        instance.save()
        return instance


class ClientSerializer(serializers.Serializer):
    country = serializers.CharField()
    request_time = serializers.DateTimeField()


class RecipeVersionSerializer(serializers.ModelSerializer):
    date_created = serializers.DateTimeField(source='revision.date_created', read_only=True)
    recipe = RecipeSerializer(source='object_version.object', read_only=True)

    class Meta:
        model = Version
        fields = [
            'id',
            'date_created',
            'recipe',
        ]
