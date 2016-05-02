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
            'name',
            'implementation',
            'implementation_url',
            'arguments_schema',
        ]


class RecipeSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    revision_id = serializers.IntegerField()
    action = ActionSerializer()
    arguments = serializers.JSONField()

    class Meta:
        model = Recipe
        fields = [
            'id',
            'name',
            'revision_id',
            'action',
            'arguments',
        ]


class BundleSerializer(serializers.ModelSerializer):
    recipes = RecipeSerializer(many=True)
    country = serializers.CharField()


class RecipeVersionSerializer(serializers.ModelSerializer):
    date_created = serializers.SerializerMethodField(read_only=True)
    recipe = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Version
        fields = [
            'date_created',
            'recipe',
        ]

    def get_date_created(self, obj):
        return obj.revision.date_created

    def get_recipe(self, obj):
        return RecipeSerializer(obj.object_version.object,
                                context={'request': self.context['request']}).data
