from rest_framework import serializers

from normandy.recipes.api.fields import ContentFileField
from normandy.recipes.models import Action, Recipe, RecipeAction


class ImplementationSerializer(serializers.Serializer):
    hash = serializers.CharField(source='implementation_hash', read_only=True)
    url = serializers.FileField(source='implementation', read_only=True)


class RecipeActionSerializer(serializers.Serializer):
    class Meta:
        model = RecipeAction

    name = serializers.CharField(source='action.name')
    implementation = ImplementationSerializer(source='action')
    arguments = serializers.JSONField()


class RecipeSerializer(serializers.Serializer):
    class Meta:
        model = Recipe

    name = serializers.CharField()
    actions = RecipeActionSerializer(source='recipeaction_set', many=True)


class ActionSerializer(serializers.ModelSerializer):
    implementation = ContentFileField(filename='implementation.js')
    arguments_schema = serializers.JSONField()

    class Meta:
        model = Action
        fields = ('name', 'implementation', 'arguments_schema')
