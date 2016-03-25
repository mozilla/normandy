from rest_framework import serializers

from normandy.recipes.api.serializers import RecipeSerializer


class BundleSerializer(serializers.Serializer):
    recipes = RecipeSerializer(many=True)
    country = serializers.CharField()
