from django.contrib.auth.models import User

from rest_framework import serializers
from reversion.models import Version

from normandy.base.api.serializers import UserSerializer
from normandy.recipes.api.fields import ActionImplementationHyperlinkField
from normandy.recipes.models import (Action, Recipe, Approval, ApprovalRequest,
                                     ApprovalRequestComment)


class ActionSerializer(serializers.ModelSerializer):
    arguments_schema = serializers.JSONField()
    implementation = serializers.CharField(write_only=True)
    implementation_url = ActionImplementationHyperlinkField()

    class Meta:
        model = Action
        fields = [
            'name',
            'implementation',
            'implementation_url',
            'arguments_schema',
        ]


class ApprovalSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    creator_id = serializers.IntegerField(source='creator.id', write_only=True)

    class Meta:
        model = Approval
        fields = [
            'id',
            'created',
            'creator',
            'creator_id',
        ]

    def validate_creator_id(self, attr):
        try:
            User.objects.get(id=attr)
        except User.DoesNotExist:
            raise serializers.ValidationError('User does not exist.')
        return attr

    def create(self, validated_data):
        creator_id = validated_data.pop('creator')['id']
        creator = User.objects.get(id=creator_id)
        approval_request = Approval.objects.create(creator=creator, **validated_data)
        return approval_request

    def update(self, instance, validated_data):
        instance.created = validated_data.get('created', instance.created)

        if 'creator' in validated_data:
            creator_id = validated_data.pop('creator')['id']
            instance.action = User.objects.get(id=creator_id)

        instance.save()
        return instance


class ApprovalRequestSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    creator_id = serializers.IntegerField(source='creator.id', write_only=True)
    approval = ApprovalSerializer(required=False)

    class Meta:
        model = ApprovalRequest
        fields = [
            'id',
            'created',
            'creator',
            'creator_id',
            'active',
            'approval',
        ]

    def validate_creator_id(self, attr):
        try:
            User.objects.get(id=attr)
        except User.DoesNotExist:
            raise serializers.ValidationError('User does not exist.')
        return attr

    def create(self, validated_data):
        creator_id = validated_data.pop('creator')['id']
        validated_data['creator'] = User.objects.get(id=creator_id)

        if 'approval' in validated_data:
            approval_data = validated_data.pop('approval')
            validated_data['approval'] = Approval.objects.create(**approval_data)

        approval_request = ApprovalRequest.objects.create(**validated_data)
        return approval_request

    def update(self, instance, validated_data):
        instance.created = validated_data.get('created', instance.created)
        instance.active = validated_data.get('active', instance.active)

        if 'approval' in validated_data:
            approval_data = validated_data.pop('approval')
            instance.approval = Approval.objects.create(**approval_data)

        if 'creator' in validated_data:
            creator_id = validated_data.pop('creator')['id']
            instance.action = User.objects.get(id=creator_id)

        instance.save()
        return instance


class ApprovalRequestCommentSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    creator_id = serializers.IntegerField(source='creator.id', write_only=True)

    class Meta:
        model = ApprovalRequestComment
        fields = [
            'id',
            'created',
            'creator',
            'creator_id',
            'text'
        ]

    def validate_creator_id(self, attr):
        try:
            User.objects.get(id=attr)
        except User.DoesNotExist:
            raise serializers.ValidationError('User does not exist.')
        return attr

    def create(self, validated_data):
        creator_id = validated_data.pop('creator')['id']
        creator = User.objects.get(id=creator_id)
        comment = ApprovalRequestComment.objects.create(creator=creator, **validated_data)
        return comment

    def update(self, instance, validated_data):
        instance.created = validated_data.get('created', instance.created)
        instance.text = validated_data.get('text', instance.text)

        if 'creator' in validated_data:
            creator_id = validated_data.pop('creator')['id']
            instance.action = User.objects.get(id=creator_id)

        instance.save()
        return instance


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
