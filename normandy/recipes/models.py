import hashlib
import json
import logging
import uuid

from django.core.cache import caches
from django.db import models
from django.utils.functional import cached_property

from rest_framework import serializers
from rest_framework.reverse import reverse
from reversion import revisions as reversion

from normandy.recipes import utils
from normandy.recipes.geolocation import get_country_code
from normandy.recipes.validators import validate_json


logger = logging.getLogger()


class Locale(models.Model):
    """Database table for locales from product_details."""
    code = models.CharField(max_length=255, unique=True)
    english_name = models.CharField(max_length=255, blank=True)
    native_name = models.CharField(max_length=255, blank=True)
    order = models.IntegerField(default=100)

    class Meta:
        ordering = ['order', 'code']

    def __str__(self):
        return '{self.code} ({self.english_name})'.format(self=self)

    def matches(self, client):
        client_val = client.locale
        if client_val is None:
            return False
        return self.code.lower() == client_val.lower()


class ReleaseChannel(models.Model):
    """Release channel of Firefox"""
    slug = models.SlugField(max_length=255, unique=True)
    name = models.CharField(max_length=255)

    class Meta:
        ordering = ['slug']

    def __str__(self):
        return self.name

    def matches(self, client):
        client_val = client.release_channel
        return self.slug == client_val or self.name == client_val


class Country(models.Model):
    """Database table for countries from django_countries."""
    code = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    order = models.IntegerField(default=100)

    class Meta:
        ordering = ['order', 'name']

    def __str__(self):
        return '{self.name} ({self.code})'.format(self=self)

    def matches(self, client):
        client_val = client.country
        return self.code == client_val or self.name == client_val


@reversion.register()
class Recipe(models.Model):
    """A set of actions to be fetched and executed by users."""
    name = models.CharField(max_length=255, unique=True)
    revision_id = models.IntegerField(default=0, editable=False)

    action = models.ForeignKey('Action')
    arguments_json = models.TextField(default='{}', validators=[validate_json])

    # Fields that determine who this recipe is sent to.
    enabled = models.BooleanField(default=False)
    locales = models.ManyToManyField(Locale, blank=True)
    countries = models.ManyToManyField(Country, blank=True)
    start_time = models.DateTimeField(blank=True, null=True, default=None)
    end_time = models.DateTimeField(blank=True, null=True, default=None)
    sample_rate = models.FloatField(
        default=1.0,
        help_text=('A number between 0.0 and 1.0. A value of 0.0 will '
                   'select no users. A value of 1.0 will select all users'))
    release_channels = models.ManyToManyField(ReleaseChannel, blank=True)

    @property
    def arguments(self):
        return json.loads(self.arguments_json)

    @arguments.setter
    def arguments(self, value):
        self.arguments_json = json.dumps(value)

    _registered_matchers = []

    @classmethod
    def register_matcher(cls, func):
        cls._registered_matchers.append(func)
        return func

    def matches(self, client, exclude=None):
        """
        Return whether this Recipe should be sent to the given client.

        :param client:
            Client to match this recipe against.
        :param exclude:
            List of registered matcher functions to exclude from this
            match call.
        """
        for matcher in self._registered_matchers:
            # Skip matchers that are explicitly excluded.
            if exclude and matcher in exclude:
                continue

            if not matcher(self, client):
                return False

        return True

    def get_locales_display(self):
        return ', '.join(str(l) for l in self.locales.all())
    get_locales_display.short_description = 'Locales'

    def get_countries_display(self):
        return ', '.join(str(l) for l in self.countries.all())
    get_countries_display.short_description = 'Countries'

    def get_release_channels_display(self):
        return ', '.join(str(l) for l in self.release_channels.all())
    get_release_channels_display.short_description = 'Release Channels'

    def __repr__(self):
        return '<Recipe "{name}">'.format(name=self.name)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        self.revision_id += 1
        super(Recipe, self).save(*args, **kwargs)


@Recipe.register_matcher
def match_enabled(recipe, client):
    return recipe.enabled


@Recipe.register_matcher
def match_times(recipe, client):
    if recipe.start_time and recipe.start_time > client.request_time:
        return False

    if recipe.end_time and recipe.end_time < client.request_time:
        return False

    return True


@Recipe.register_matcher
def match_sample_rate(recipe, client):
    if recipe.sample_rate is not None:
        inputs = [recipe.pk, recipe.revision_id, client.user_id]
        if not utils.deterministic_sample(recipe.sample_rate, inputs):
            return False

    return True


def multivalue_matcher(field_getter):
    """
    Makes matcher that accepts if any of the recipe's values accept.

    :param field_getter: A function that returns an object with a
        `match` method which will be passed the client to decide if the
        object accepts the client.
    """
    @Recipe.register_matcher
    def matcher(recipe, client):
        field_vals = list(field_getter(recipe))

        if not field_vals:
            return True

        for val in field_vals:
            if val.matches(client):
                return True
        return False

    return matcher


@multivalue_matcher
def get_locales(recipe):
    return recipe.locales.all()


@multivalue_matcher
def get_country(recipe):
    return recipe.countries.all()


@multivalue_matcher
def get_release_channels(recipe):
    return recipe.release_channels.all()


@reversion.register()
class Action(models.Model):
    """A single executable action that can take arguments."""
    name = models.SlugField(max_length=255, unique=True)

    implementation = models.TextField()
    implementation_hash = models.CharField(max_length=40, editable=False)

    arguments_schema_json = models.TextField(default='{}', validators=[validate_json])

    @property
    def arguments_schema(self):
        return json.loads(self.arguments_schema_json)

    @arguments_schema.setter
    def arguments_schema(self, value):
        self.arguments_schema_json = json.dumps(value)

    @property
    def in_use(self):
        """True if this action is being used by any active recipes."""
        return self.recipes_used_by.exists()

    @property
    def recipes_used_by(self):
        """Set of enabled recipes that are using this action."""
        return self.recipe_set.filter(enabled=True)

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        return reverse('action-detail', args=[self.name])

    def compute_implementation_hash(self):
        return hashlib.sha1(self.implementation.encode()).hexdigest()

    def save(self, *args, **kwargs):
        # Save first so the upload is available.
        super().save(*args, **kwargs)

        # Update hash
        self.implementation_hash = self.compute_implementation_hash()
        super().save(update_fields=['implementation_hash'])


class Client(object):
    """A client attempting to fetch a set of recipes."""

    class Parameters(serializers.Serializer):
        """For parsing the bodies of requests to retrieve client data"""
        locale = serializers.CharField()
        user_id = serializers.CharField()
        release_channel = serializers.CharField()
        version = serializers.CharField()

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
        try:
            ip_address = self.request.META['HTTP_X_FORWARDED_FOR'].split(',')[0]
        except (KeyError, IndexError):
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
    def __init__(self, recipes=None, country=None):
        self.recipes = sorted(recipes, key=lambda r: r.name) or []
        self.country = country

    @classmethod
    def for_client(cls, client, exclude=None):
        """
        Return a bundle of recipes matching the given HTTPRequest.

        :param exclude:
            List of registered recipe matchers to exclude from matching.
        """
        recipes = (
            recipe for recipe in enabled_recipes()
            if recipe.matches(client, exclude=exclude)
        )

        return cls(recipes=recipes, country=client.country)

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
