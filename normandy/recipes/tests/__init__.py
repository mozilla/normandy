import hashlib
import json

from django.utils import timezone

import factory

from normandy.base.tests import FuzzyUnicode, UserFactory
from normandy.base.utils import sri_hash
from normandy.recipes.models import (
    Action,
    ApprovalRequest,
    Channel,
    Client,
    Country,
    EnabledState,
    Locale,
    Recipe,
    RecipeRevision,
    Signature,
)


class ChannelFactory(factory.DjangoModelFactory):
    class Meta:
        model = Channel
        django_get_or_create = ("slug",)

    slug = "beta"
    name = "Beta"


class CountryFactory(factory.DjangoModelFactory):
    class Meta:
        model = Country
        django_get_or_create = ("code",)

    code = "SE"
    name = "Sweden"


class LocaleFactory(factory.DjangoModelFactory):
    class Meta:
        model = Locale
        django_get_or_create = ("code",)

    code = "sv"
    name = "Swedish"


class ActionFactory(factory.DjangoModelFactory):
    class Meta:
        model = Action

    name = FuzzyUnicode()
    implementation = 'console.log("test");'

    @factory.lazy_attribute
    def implementation_hash(action):
        if action.implementation is not None:
            return sri_hash(action.implementation.encode(), url_safe=True)

    # It is important that the signature be based on the actual data, and not
    # some static value so that tests can make assertions against what data was
    # signed.

    @factory.post_generation
    def signed(self, create, extracted=False, **kwargs):
        if extracted:
            self.signature = SignatureFactory(data=self.canonical_json())
            self.signature.save()
            self.save()
        elif extracted is False:
            self.signature = None
            self.save()


class RecipeFactory(factory.DjangoModelFactory):
    class Meta:
        model = Recipe

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        obj = model_class()
        obj.save()

        revision = RecipeRevisionFactory(**kwargs)
        revision.action.save()
        obj.revise(**revision.data)

        return obj

    @factory.post_generation
    def channels(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            for channel in extracted:
                self.channels.add(channel)

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

    # This should always be before `enabler`
    @factory.post_generation
    def approver(self, create, extracted, **kwargs):
        if extracted:
            approval = ApprovalRequestFactory(revision=self.latest_revision)
            approval.approve(extracted, "r+")

    @factory.post_generation
    def enabled(self, create, extracted, **kwargs):
        if extracted:
            self.approved_revision.enable(UserFactory())
            self.refresh_from_db()  # Ensure signature side-effect is picked up

    # This should always be after `approver` as we require approval to enable a recipe
    @factory.post_generation
    def enabler(self, create, extracted, **kwargs):
        if extracted:
            self.approved_revision.enable(extracted)
            self.refresh_from_db()  # Ensure signature side-effect is picked up

    # NOTE: This should always be last or the signature gets erased.
    # It is important that the signature be based on the actual data, and not
    # some static value so that tests can make assertions against what data was
    # signed.
    @factory.post_generation
    def signed(self, create, extracted=False, **kwargs):
        if extracted:
            self.signature = SignatureFactory(data=self.canonical_json())
            self.signature.save()
            self.save()
        elif extracted is False:
            self.signature = None
            self.save()


class FuzzyIdenticonSeed(factory.fuzzy.FuzzyText):
    """A FuzzyText factory to generate identicon seeds."""

    def __init__(self, **kwargs):
        super().__init__(prefix="v1:", **kwargs)


@factory.use_strategy(factory.BUILD_STRATEGY)
class RecipeRevisionFactory(factory.DjangoModelFactory):
    class Meta:
        model = RecipeRevision

    name = FuzzyUnicode()
    action = factory.SubFactory(ActionFactory)
    recipe = factory.SubFactory(RecipeFactory)
    identicon_seed = FuzzyIdenticonSeed()
    comment = FuzzyUnicode()
    extra_filter_expression = factory.fuzzy.FuzzyChoice(["true", "false"])

    @factory.lazy_attribute
    def filter_object_json(self):
        filters = [
            ChannelFilterFactory(),
            LocaleFilterFactory(),
            CountryFilterFactory(),
            StableSampleFilterFactory(),
            BucketSampleFilterFactory(),
        ]
        return json.dumps(filters)


class DictFactory(factory.Factory):
    class Meta:
        model = dict


class ChannelFilterFactory(DictFactory):
    class Params:
        channel_objects = factory.LazyAttribute(lambda o: [ChannelFactory()])

    type = "channel"
    channels = factory.LazyAttribute(lambda o: [channel.slug for channel in o.channel_objects])


class LocaleFilterFactory(DictFactory):
    class Params:
        locale_objects = factory.LazyAttribute(lambda o: [LocaleFactory()])

    type = "locale"
    locales = factory.LazyAttribute(lambda o: [locale.code for locale in o.locale_objects])


class CountryFilterFactory(DictFactory):
    class Params:
        country_objects = factory.LazyAttribute(lambda o: [CountryFactory()])

    type = "country"
    countries = factory.LazyAttribute(lambda o: [country.code for country in o.country_objects])


class FuzzySampleInputs(factory.fuzzy.FuzzyChoice):
    def __init__(self, **kwargs):
        super().__init__(
            [
                ["normandy.userId"],
                ["normandy.userId", "42"],
                ["normandy.userId", '"some study"'],
                ["normandy.userId", "normandy.recipe.id"],
                ["normandy.recipe.id", "normandy.userId"],
            ]
        )


class StableSampleFilterFactory(DictFactory):
    type = "stableSample"
    input = FuzzySampleInputs()
    rate = factory.fuzzy.FuzzyFloat(0.0, 1.0)


class BucketSampleFilterFactory(DictFactory):
    type = "bucketSample"
    input = FuzzySampleInputs()
    total = factory.fuzzy.FuzzyInteger(100, 10000)
    start = factory.LazyAttribute(lambda o: factory.fuzzy.FuzzyInteger(0, o.total).fuzz())
    count = factory.LazyAttribute(lambda o: factory.fuzzy.FuzzyInteger(0, o.total).fuzz())


class ApprovalRequestFactory(factory.DjangoModelFactory):
    class Meta:
        model = ApprovalRequest

    revision = factory.SubFactory(RecipeRevisionFactory)


class EnabledStateFactory(factory.DjangoModelFactory):
    class Meta:
        model = EnabledState

    creator = factory.SubFactory(UserFactory)
    revision = factory.SubFactory(RecipeRevisionFactory)


class SignatureFactory(factory.DjangoModelFactory):
    class Meta:
        model = Signature
        exclude = ["data"]

    data = b""
    signature = factory.LazyAttribute(lambda o: hashlib.sha256(o.data).hexdigest())
    public_key = "MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEh+JqU60off8jnvWkQAnP/P4vdKjP0aFiK4rrDne5rsqNd4A4A/z5P2foRFltlS6skODDIUu4X/C2pwROMgSXpkRFZxXk9IwATCRCVQ7YnffR8f1Jw5fWzCerDmf5fAj5"  # noqa
    x5u = "https://example.com/fake.x5u"


class ClientFactory(factory.Factory):
    class Meta:
        model = Client

    country = "US"
    request_time = factory.LazyAttribute(lambda o: timezone.now)


ARGUMENTS_SCHEMA = {
    "required": ["surveyId", "surveys"],
    "properties": {
        "surveyId": {"type": "string"},
        "surveys": {
            "type": "array",
            "minItems": 1,
            "items": {
                "properties": {
                    "title": {"type": "string"},
                    "weight": {"type": "integer", "minimum": 1},
                },
                "required": ["title", "weight"],
            },
        },
    },
}


def fake_sign(datas):
    return [{"signature": hashlib.sha256(d).hexdigest()} for d in datas]
