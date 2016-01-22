import factory

from normandy.base.tests import FuzzyUnicode
from normandy.recipes.models import Action, Locale, Recipe, RecipeAction


class RecipeFactory(factory.DjangoModelFactory):
    class Meta:
        model = Recipe

    name = FuzzyUnicode()
    enabled = True

    @factory.post_generation
    def locale(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted and isinstance(extracted, str):
            self.locale, _ = Locale.objects.get_or_create(code=extracted)


class ActionFactory(factory.DjangoModelFactory):
    class Meta:
        model = Action

    name = FuzzyUnicode()
    implementation = factory.django.FileField(data=b'console.log("test");')


class RecipeActionFactory(factory.DjangoModelFactory):
    class Meta:
        model = RecipeAction

    action = factory.SubFactory(ActionFactory)
    recipe = factory.SubFactory(RecipeFactory)


class LocaleFactory(factory.DjangoModelFactory):
    class Meta:
        model = Locale
