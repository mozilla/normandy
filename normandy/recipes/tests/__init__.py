import hashlib

import factory

from django.template.defaultfilters import slugify
from django.test import RequestFactory

from normandy.base.tests import FuzzyUnicode, UserFactory
from normandy.recipes.models import (
    Action,
    Client,
    Country,
    Locale,
    Recipe,
    ReleaseChannel,
)


class ActionFactory(factory.DjangoModelFactory):
    class Meta:
        model = Action

    name = FuzzyUnicode()
    implementation = 'console.log("test");'

    @factory.lazy_attribute
    def implementation_hash(action):
        return hashlib.sha1(action.implementation.encode()).hexdigest()


class RecipeFactory(factory.DjangoModelFactory):
    class Meta:
        model = Recipe

    name = FuzzyUnicode()
    action = factory.SubFactory(ActionFactory)
    approver = factory.SubFactory(UserFactory)
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


class ClientFactory(factory.Factory):
    class Meta:
        model = Client

    request = factory.LazyAttribute(lambda o: RequestFactory().get('/'))
