import factory

from django.template.defaultfilters import slugify

from normandy.base.tests import FuzzyUnicode
from normandy.recipes.models import Action, Locale, Recipe, RecipeAction, ReleaseChannel


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

    @factory.post_generation
    def release_channels(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            for channel in extracted:
                self.release_channels.add(channel)


class ActionFactory(factory.DjangoModelFactory):
    class Meta:
        model = Action

    name = FuzzyUnicode()
    implementation = 'console.log("test");'


class RecipeActionFactory(factory.DjangoModelFactory):
    class Meta:
        model = RecipeAction

    action = factory.SubFactory(ActionFactory)
    recipe = factory.SubFactory(RecipeFactory)


class LocaleFactory(factory.DjangoModelFactory):
    class Meta:
        model = Locale


class ReleaseChannelFactory(factory.DjangoModelFactory):
    class Meta:
        model = ReleaseChannel

    name = FuzzyUnicode()
    slug = factory.LazyAttribute(lambda o: slugify(o.name))
