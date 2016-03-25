import hashlib
import uuid

from django.core.cache import caches
from django.utils.functional import cached_property

from rest_framework import serializers

from normandy.classifier.geolocation import get_country_code
from normandy.recipes.models import Recipe


class Client(object):
    """A client attempting to fetch a set of recipes."""

    class Parameters(serializers.Serializer):
        """For parsing the bodies of requests to retrieve client data"""
        locale = serializers.CharField(default=None)
        user_id = serializers.CharField(default=None)

    def __init__(self, request=None, **kwargs):
        self.request = request

        if self.request and hasattr(self.request, 'data'):
            serializer = self.Parameters(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.data = serializer.data
        else:
            self.data = {}

        fields = ['locale', 'release_channel', 'country', 'user_id', 'request_time']
        for field in fields:
            val = kwargs.get(field)
            if val is not None:
                setattr(self, field, kwargs[field])

    @cached_property
    def locale(self):
        return self.data.get('locale')

    @cached_property
    def country(self):
        ip_address = self.request.META.get('REMOTE_ADDR')
        return get_country_code(ip_address)

    @cached_property
    def request_time(self):
        return self.request.received_at

    @cached_property
    def user_id(self):
        """
        A UUID unique to a user, sent to us from Firefox.

        If the user did not provide an ID, this returns a random UUID.
        """
        if self.data.get('user_id'):
            return self.data['user_id']
        return str(uuid.uuid4())

    @cached_property
    def release_channel(self):
        return self.data.get('release_channel')


def enabled_recipes():
    key = 'normandy.classifer.enabled_recipes'
    cache = caches['recipes']
    recipes = cache.get(key)
    if recipes is None:
        recipes = (
            Recipe.objects.filter(enabled=True)
            .prefetch_related(
                'locales',
                'countries',
                'release_channels',
                'action',
            ))
        cache.set(key, recipes)
    return recipes


class Bundle(object):
    """A bundle of recipes to be sent to the client."""
    def __init__(self, recipes=None):
        self.recipes = sorted(recipes, key=lambda r: r.name) or []

    @classmethod
    def for_client(cls, client, exclude=None):
        """
        Return a bundle of recipes matching the given HTTPRequest.

        :param exclude:
            List of registered recipe matchers to exclude from matching.
        """
        return cls(
            recipe for recipe in enabled_recipes()
            if recipe.matches(client, exclude=exclude)
        )

    @property
    def ids(self):
        return [recipe.id for recipe in self.recipes]

    @property
    def hash(self):
        hash_parts = []
        for recipe in self.recipes:
            hash_parts.extend(action.implementation_hash for action in recipe.actions.all())
        recipe_hashes = '_'.join(hash_parts)
        return hashlib.sha1(recipe_hashes.encode('utf-8')).hexdigest()

    def __repr__(self):
        return '<Bundle ids={!r}>'.format(self.recipes)

    def __iter__(self):
        yield from self.recipes
