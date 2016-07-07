import hashlib

import factory

from django.template.defaultfilters import slugify
from django.test import RequestFactory

from normandy.base.tests import FuzzyUnicode, UserFactory
from normandy.recipes.models import (
    Action,
    Approval,
    ApprovalRequest,
    ApprovalRequestComment,
    Client,
    Country,
    Locale,
    Recipe,
    ReleaseChannel,
    Signature,
)


class ActionFactory(factory.DjangoModelFactory):
    class Meta:
        model = Action

    name = FuzzyUnicode()
    implementation = 'console.log("test");'

    @factory.lazy_attribute
    def implementation_hash(action):
        return hashlib.sha1(action.implementation.encode()).hexdigest()


class ApprovalFactory(factory.DjangoModelFactory):
    class Meta:
        model = Approval

    creator = factory.SubFactory(UserFactory)


class RecipeFactory(factory.DjangoModelFactory):
    class Meta:
        model = Recipe

    name = FuzzyUnicode()
    action = factory.SubFactory(ActionFactory)
    enabled = True
    approval = factory.SubFactory(ApprovalFactory)

    @factory.post_generation
    def signed(self, create, extracted=False, **kwargs):
        if extracted:
            self.signature = SignatureFactory()
            self.signature.save()
            self.save()
        else:
            return None

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


class ApprovalRequestFactory(factory.DjangoModelFactory):
    class Meta:
        model = ApprovalRequest

    recipe = factory.SubFactory(RecipeFactory)
    creator = factory.SubFactory(UserFactory)


class ApprovalRequestCommentFactory(factory.DjangoModelFactory):
    class Meta:
        model = ApprovalRequestComment

    approval_request = factory.SubFactory(ApprovalRequestFactory)
    creator = factory.SubFactory(UserFactory)


class SignatureFactory(factory.DjangoModelFactory):
    class Meta:
        model = Signature

    signature = 'fake signature'


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
