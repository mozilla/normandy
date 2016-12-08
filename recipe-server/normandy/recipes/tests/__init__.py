import hashlib

from django.utils import timezone

import factory

from normandy.base.tests import FuzzyUnicode
from normandy.recipes.models import (
    Action,
    Client,
    Recipe,
    RecipeRevision,
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


class RecipeFactory(factory.DjangoModelFactory):
    class Meta:
        model = Recipe

    enabled = True

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        obj = model_class(*args, **kwargs)
        obj.save()

        kwargs.pop('enabled')

        revision = RecipeRevisionFactory(**kwargs)
        revision.action.save()
        obj.update(**revision.data)
        return obj

    # It is important that the signature be based on the actual data, and not
    # some static value so that tests can make assertions against what data was
    # signed.

    @factory.post_generation
    def signed(self, create, extracted=False, **kwargs):
        if extracted:
            self.signature = SignatureFactory(data=self.canonical_json())
            self.signature.save()
            self.save()
        else:
            return None


@factory.use_strategy(factory.BUILD_STRATEGY)
class RecipeRevisionFactory(factory.DjangoModelFactory):
    class Meta:
        model = RecipeRevision

    name = FuzzyUnicode()
    action = factory.SubFactory(ActionFactory)
    recipe = factory.SubFactory(RecipeFactory)


class SignatureFactory(factory.DjangoModelFactory):
    class Meta:
        model = Signature
        exclude = ['data']

    data = b''
    signature = factory.LazyAttribute(lambda o: hashlib.sha256(o.data).hexdigest())
    public_key = 'MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEh+JqU60off8jnvWkQAnP/P4vdKjP0aFiK4rrDne5rsqNd4A4A/z5P2foRFltlS6skODDIUu4X/C2pwROMgSXpkRFZxXk9IwATCRCVQ7YnffR8f1Jw5fWzCerDmf5fAj5'  # noqa
    x5u = 'https://example.com/fake.x5u'


class ClientFactory(factory.Factory):
    class Meta:
        model = Client

    country = 'US'
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
                    "weight": {"type": "integer", "minimum": 1}
                },
                "required": ["title", "weight"]
            },
        },
    },
}
