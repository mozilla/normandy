import factory

from django.template.defaultfilters import slugify

from normandy.base.tests import FuzzyUnicode
from normandy.recipes.models import Action, Country, Locale, Recipe, RecipeAction, ReleaseChannel


class RecipeFactory(factory.DjangoModelFactory):
    class Meta:
        model = Recipe

    name = FuzzyUnicode()
    enabled = True

    @factory.post_generation
    def countries(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            for country in extracted:
                self.countries.add(country)

    @factory.post_generation
    def locales(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            for locale in extracted:
                self.locales.add(locale)

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


class CountryFactory(factory.DjangoModelFactory):
    class Meta:
        model = Country

    code = factory.fuzzy.FuzzyText(length=3)


class LocaleFactory(factory.DjangoModelFactory):
    class Meta:
        model = Locale

    code = factory.fuzzy.FuzzyText(length=2)


class ReleaseChannelFactory(factory.DjangoModelFactory):
    class Meta:
        model = ReleaseChannel

    name = FuzzyUnicode()
    slug = factory.LazyAttribute(lambda o: slugify(o.name))
