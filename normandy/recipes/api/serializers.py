from rest_framework import serializers
from reversion.models import Version

from normandy.recipes.api.fields import ActionImplementationHyperlinkField
from normandy.recipes.models import Action, Recipe


class ActionSerializer(serializers.ModelSerializer):
    arguments_schema = serializers.JSONField()
    implementation = serializers.CharField(write_only=True)
    implementation_url = ActionImplementationHyperlinkField()

    class Meta:
        model = Action
        fields = [
            'id',
            'name',
            'implementation',
            'implementation_url',
            'arguments_schema',
        ]


class RecipeSerializer(serializers.ModelSerializer):
    action_id = serializers.IntegerField(source='action.id')
    arguments = serializers.JSONField()

    class Meta:
        model = Recipe
        fields = [
            'id',
            'name',
            'enabled',
            'revision_id',
            'action_id',
            'arguments',
            'filter_expression',
        ]

    def create(self, validated_data):
        action_id = validated_data.pop('action')['id']
        action = Action.objects.get(pk=action_id)
        recipe = Recipe.objects.create(action=action, **validated_data)
        return recipe

    def update(self, instance, validated_data):
        instance.name = validated_data.get('name', instance.name)
        instance.arguments = validated_data.get('arguments', instance.arguments)

        if 'action' in validated_data:
            action_id = validated_data.pop('action')['id']
            instance.action = Action.objects.get(pk=action_id)

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
            'date_created',
            'recipe',
        ]
