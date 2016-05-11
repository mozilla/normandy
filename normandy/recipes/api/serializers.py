from rest_framework import serializers
from reversion.models import Version

from normandy.base.api.serializers import UserSerializer
from normandy.recipes.api.fields import ActionImplementationHyperlinkField
from normandy.recipes.models import Action, Recipe


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


class RecipeSerializer(serializers.ModelSerializer):
    action_name = serializers.CharField(source='action.name')
    arguments = serializers.JSONField()
    approver = UserSerializer(read_only=True)
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
            'approver',
            'is_approved',
            'enabled',
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
