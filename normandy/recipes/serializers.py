from rest_framework import serializers

from normandy.recipes.models import Recipe, RecipeAction


class ImplementationSerializer(serializers.Serializer):
    hash = serializers.CharField(source='implementation_hash', read_only=True)
    url = serializers.URLField(source='get_absolute_url', read_only=True)


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
