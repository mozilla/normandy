from rest_framework import serializers

from normandy.recipes.models import Action, Recipe


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


class ImplementationSerializer(serializers.Serializer):
    name = serializers.CharField()
    hash = serializers.CharField(source='implementation_hash', read_only=True)
    url = serializers.HyperlinkedIdentityField(
        view_name='action-implementation',
        lookup_field='name')


class RecipeSerializer(serializers.Serializer):
    class Meta:
        model = Recipe

    name = serializers.CharField()
    id = serializers.IntegerField()
    implementation = ImplementationSerializer(source='action')
    arguments = serializers.JSONField()
