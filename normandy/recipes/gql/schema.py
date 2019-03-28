import graphene

from normandy.recipes.gql import types
from normandy.recipes.models import Recipe


class Query(object):
    all_recipes = graphene.List(types.RecipeType)

    def resolve_all_recipes(self, info, **kwargs):
        return Recipe.objects.all()
