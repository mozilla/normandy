from rest_framework import serializers

from normandy.recipes.models import Action, Recipe, RecipeAction


class ImplementationSerializer(serializers.Serializer):
    hash = serializers.CharField(source='implementation_hash', read_only=True)
    url = serializers.HyperlinkedIdentityField(
        view_name='action-implementation',
        lookup_field='name')


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
    arguments_schema = serializers.JSONField()
    implementation = serializers.CharField(write_only=True)
    implementation_url = serializers.HyperlinkedIdentityField(
        view_name='action-implementation',
        lookup_field='name')

    class Meta:
        model = Action
        fields = [
            'name',
            'implementation',
            'implementation_url',
            'implementation_hash',
            'arguments_schema',
        ]
