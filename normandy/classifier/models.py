import hashlib

import uuid

from django.utils.functional import cached_property

from normandy.classifier.geolocation import get_country_code
from normandy.recipes.models import Recipe


class Client(object):
    """A client attempting to fetch a set of recipes."""
    def __init__(self, request, locale=None, release_channel=None):
        self.request = request
        self.locale = locale
        self.release_channel = release_channel

    @cached_property
    def country(self):
        ip_address = self.request.META.get('REMOTE_ADDR')
        return get_country_code(ip_address)

    @property
    def request_time(self):
        return self.request.received_at

    @property
    def user_id(self):
        """
        A UUID unique to a user, sent to us from Firefox.

        If the user did not provide an ID, this returns a random UUID.
        """
        # TODO: Eventually this will be something from the request.
        return str(uuid.uuid4())


class Bundle(object):
    """A bundle of recipes to be sent to the client."""
    def __init__(self, recipes=None):
        self.recipes = sorted(recipes, key=lambda r: r.name) or []

    @classmethod
    def for_client(cls, client):
        """Return a bundle of recipes matching the given HTTPRequest."""
        return cls(
            recipe for recipe in Recipe.objects.filter(enabled=True) if recipe.matches(client)
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
