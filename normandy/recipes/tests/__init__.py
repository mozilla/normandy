import factory
from factory import fuzzy

from normandy.recipes.models import Action, Recipe, RecipeAction


class FuzzyUnicode(fuzzy.FuzzyText):
    """A FuzzyText factory that contains at least one non-ASCII character."""

    def __init__(self, prefix=u'', **kwargs):
        prefix = '%sđ' % prefix
        super(FuzzyUnicode, self).__init__(prefix=prefix, **kwargs)


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
