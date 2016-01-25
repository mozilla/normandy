import factory

from normandy.base.tests import FuzzyUnicode
from normandy.recipes.models import Action, Recipe, RecipeAction


class RecipeFactory(factory.DjangoModelFactory):
    class Meta:
        model = Recipe

    name = FuzzyUnicode()
    enabled = True


class ActionFactory(factory.DjangoModelFactory):
    class Meta:
        model = Action

    name = FuzzyUnicode()
    implementation = FuzzyUnicode(prefix='// ')


class RecipeActionFactory(factory.DjangoModelFactory):
    class Meta:
        model = RecipeAction

    action = factory.SubFactory(ActionFactory)
    recipe = factory.SubFactory(RecipeFactory)
