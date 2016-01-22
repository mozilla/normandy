from rest_framework import serializers

from normandy.recipes.serializers import RecipeSerializer


class BundleSerializer(serializers.Serializer):
    recipes = RecipeSerializer(many=True)
