import hashlib
import os
import json

from django.conf import settings
from django.utils import timezone

import factory
from factory.django import DjangoModelFactory

from normandy.base.tests import FuzzyUnicode, UserFactory, FuzzySlug
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
    WindowsVersion,
)


class ChannelFactory(DjangoModelFactory):
    class Meta:
        model = Channel
        django_get_or_create = ("slug",)

    slug = "beta"
    name = "Beta"


class WindowsVersionFactory(DjangoModelFactory):
    class Meta:
        model = WindowsVersion
        django_get_or_create = ("nt_version",)

    nt_version = 6.1
    name = "Windows 7"


class CountryFactory(DjangoModelFactory):
    class Meta:
        model = Country
        django_get_or_create = ("code",)

    code = "SE"
    name = "Sweden"


class LocaleFactory(DjangoModelFactory):
    class Meta:
        model = Locale
        django_get_or_create = ("code",)

    code = "sv"
    name = "Swedish"


_action_schemas = None


def get_action_schemas():
    global _action_schemas
    if _action_schemas is None:
        action_schemas_fp = os.path.join(settings.ACTIONS_SCHEMA_DIRECTORY, "schemas.json")
        with open(action_schemas_fp) as f:
            action_schemas = json.load(f)

        aliases = settings.ACTIONS_ALIAS_NAMES
        updates = {}
        for name in action_schemas:
            if name in aliases:
                alias = aliases[name]
                updates[alias] = action_schemas[name]
        action_schemas.update(**updates)

        _action_schemas = action_schemas
    return _action_schemas


class ActionFactory(DjangoModelFactory):
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

    @factory.post_generation
    def arguments_schema(self, create, extracted=None, **kwargs):
        if extracted is not None:
            self.arguments_schema = extracted
            return

        action_schemas = get_action_schemas()

        if self.name in action_schemas:
            self.arguments_schema = action_schemas[self.name]
        else:
            self.arguments_schema = {}


class RecipeFactory(DjangoModelFactory):
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

    @factory.post_generation
    def filter_object(self, create, extracted, **kwargs):
        if extracted:
            self.latest_revision.filter_object = extracted

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
    # A recipe must be approved in order to be signed, so make sure
    # you've passed approver.
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


class DictFactory(factory.Factory):
    class Meta:
        abstract = True
        model = dict


class PreferenceExperimentBranchFactory(DictFactory):
    slug = FuzzySlug()
    ratio = factory.fuzzy.FuzzyInteger(1, 100)
    value = factory.fuzzy.FuzzyText()


class PreferenceExperimentArgumentsFactory(DictFactory):
    slug = FuzzySlug()
    preferenceName = factory.Sequence(lambda n: f"experiment.pref-{n}")
    preferenceType = "string"

    @factory.post_generation
    def branches(self, create, extracted=None, **kwargs):
        if extracted is not None:
            self["branches"] = [
                PreferenceExperimentBranchFactory(**kwargs, **branch) for branch in extracted
            ]
        else:
            self["branches"] = PreferenceExperimentBranchFactory.create_batch(2, **kwargs)


class PreferenceRolloutPreferenceFactory(DictFactory):
    preferenceName = factory.Sequence(lambda n: f"rollout.pref-{n}")
    value = factory.fuzzy.FuzzyText()


class PreferenceRolloutArgumentsFactory(DictFactory):
    slug = FuzzySlug()

    @factory.post_generation
    def preferences(arguments, create, extracted=None, **kwargs):
        if extracted is not None:
            arguments["preferences"] = [
                PreferenceRolloutPreferenceFactory(**kwargs, **spec) for spec in extracted
            ]
        else:
            arguments["preferences"] = PreferenceRolloutPreferenceFactory.create_batch(2, **kwargs)


class OptOutStudyArgumentsFactory(DictFactory):
    name = factory.fuzzy.FuzzyText()
    description = factory.faker.Faker("paragraph")
    addonUrl = factory.lazy_attribute(
        lambda x: f"https://example.com/{x}" + factory.faker.Faker("file_path").generate()
    )
    extensionApiId = factory.fuzzy.FuzzyInteger(1, 1000)


class MultiPreferenceExperimentBranchFactory(DictFactory):
    slug = FuzzySlug()
    ratio = factory.fuzzy.FuzzyInteger(1, 100)
    preferences = factory.Sequence(
        lambda n: {
            f"multi-experiment.pref-{n}": {
                "preferenceBranchType": "default",
                "preferenceValue": "test",
                "preferenceType": "string",
            }
        }
    )
    value = factory.fuzzy.FuzzyText()


class MultiPreferenceExperimentArgumentsFactory(DictFactory):
    slug = FuzzySlug()
    userFacingName = factory.faker.Faker("sentence")
    userFacingDescription = factory.faker.Faker("paragraph")

    @factory.post_generation
    def branches(self, create, extracted=None, **kwargs):
        if extracted is not None:
            self["branches"] = [
                MultiPreferenceExperimentBranchFactory(**kwargs, **branch) for branch in extracted
            ]
        else:
            self["branches"] = MultiPreferenceExperimentBranchFactory.create_batch(2, **kwargs)


argument_factories = {
    "preference-experiment": PreferenceExperimentArgumentsFactory,
    "preference-rollout": PreferenceRolloutArgumentsFactory,
    "opt-out-study": OptOutStudyArgumentsFactory,
    "multi-preference-experiment": MultiPreferenceExperimentArgumentsFactory,
}


@factory.use_strategy(factory.BUILD_STRATEGY)
class RecipeRevisionFactory(DjangoModelFactory):
    class Meta:
        model = RecipeRevision

    name = FuzzyUnicode()
    action = factory.SubFactory(ActionFactory)
    recipe = factory.SubFactory(RecipeFactory)
    identicon_seed = FuzzyIdenticonSeed()
    comment = FuzzyUnicode()
    extra_filter_expression = factory.fuzzy.FuzzyChoice(["true", "false"])
    extra_capabilities = []

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

    @factory.post_generation
    def arguments(revision, create, extracted=None, **kwargs):
        arguments_factory = argument_factories.get(revision.action.name)
        if arguments_factory:
            if extracted is None:
                extracted = {}
            revision.arguments = arguments_factory(**kwargs, **extracted)
        elif extracted is not None:
            revision.arguments = {**extracted, **kwargs}


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


class ApprovalRequestFactory(DjangoModelFactory):
    class Meta:
        model = ApprovalRequest

    revision = factory.SubFactory(RecipeRevisionFactory)


class EnabledStateFactory(DjangoModelFactory):
    class Meta:
        model = EnabledState

    creator = factory.SubFactory(UserFactory)
    revision = factory.SubFactory(RecipeRevisionFactory)


class SignatureFactory(DjangoModelFactory):
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
