import hashlib
import json
import logging

from django.db import models

from adminsortable.models import SortableMixin
from rest_framework.reverse import reverse

from normandy.recipes import utils
from normandy.recipes.fields import PercentField
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


class Recipe(models.Model):
    """A set of actions to be fetched and executed by users."""
    name = models.CharField(max_length=255, unique=True)
    actions = models.ManyToManyField('Action', through='RecipeAction')

    # Fields that determine who this recipe is sent to.
    enabled = models.BooleanField(default=False)
    locales = models.ManyToManyField(Locale, blank=True)
    countries = models.ManyToManyField(Country, blank=True)
    start_time = models.DateTimeField(blank=True, null=True, default=None)
    end_time = models.DateTimeField(blank=True, null=True, default=None)
    sample_rate = PercentField(default=100)
    release_channels = models.ManyToManyField(ReleaseChannel, blank=True)

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
        inputs = [recipe.pk, client.user_id]
        if not utils.deterministic_sample(recipe.sample_rate / 100.0, inputs):
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

    def compute_hash(self):
        return hashlib.sha1(self.implementation.encode()).hexdigest()

    def save(self, *args, **kwargs):
        # Save first so the upload is available.
        super().save(*args, **kwargs)

        # Update hash
        self.implementation_hash = self.compute_hash()
        super().save(update_fields=['implementation_hash'])


class RecipeAction(SortableMixin):
    """
    An instance of an action within a recipe with associated arguments.
    """
    recipe = models.ForeignKey(Recipe)
    action = models.ForeignKey(Action)
    arguments_json = models.TextField(default='{}', validators=[validate_json])
    order = models.PositiveIntegerField(default=0, editable=False, db_index=True)

    @property
    def arguments(self):
        return json.loads(self.arguments_json)

    @arguments.setter
    def arguments(self, value):
        self.arguments_json = json.dumps(value)

    class Meta:
        ordering = ['order']
