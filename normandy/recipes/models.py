import hashlib
import json
import logging

from django.db import models

from adminsortable.models import SortableMixin
from django_countries.fields import CountryField
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

    class Meta:
        ordering = ['code']

    def __str__(self):
        return '{self.code} ({self.english_name})'.format(self=self)


class Recipe(models.Model):
    """A set of actions to be fetched and executed by users."""
    name = models.CharField(max_length=255, unique=True)
    actions = models.ManyToManyField('Action', through='RecipeAction')

    # Fields that determine who this recipe is sent to.
    enabled = models.BooleanField(default=False)
    locale = models.ForeignKey(Locale, blank=True, null=True)
    country = CountryField(blank=True, null=True, default=None)
    start_time = models.DateTimeField(blank=True, null=True, default=None)
    end_time = models.DateTimeField(blank=True, null=True, default=None)
    sample_rate = PercentField(default=100)

    def log_rejection(self, msg):
        logger.debug('{} rejected: {}'.format(self, msg))

    def matches(self, client):
        """
        Return whether this Recipe should be sent to the given client.
        """
        if not self.enabled:
            self.log_rejection('not enabled')
            return False

        if self.locale and client.locale and self.locale.code.lower() != client.locale.lower():
            self.log_rejection('recipe locale ({self.locale!r}) != '
                               'client locale ({client.locale!r})')
            return False

        if self.country and self.country != client.country:
            self.log_rejection('recipe country ({self.country!r}) != '
                               'client country ({client.country!r})')
            return False

        if self.start_time and self.start_time > client.request_time:
            self.log_rejection('start time not met ({})'.format(self.start_time))
            return False

        if self.end_time and self.end_time < client.request_time:
            self.log_rejection('end time already passed ({})'.format(self.end_time))
            return False

        if self.sample_rate:
            inputs = [self.pk, client.user_id]
            if not utils.deterministic_sample(self.sample_rate / 100.0, inputs):
                self.log_rejection('did not match sample')
                return False

        return True

    def __repr__(self):
        return '<Recipe "{name}">'.format(name=self.name)

    def __str__(self):
        return self.name


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

    def save(self, *args, **kwargs):
        # Save first so the upload is available.
        super().save(*args, **kwargs)

        # Update hash
        self.implementation_hash = hashlib.sha1(self.implementation.encode()).hexdigest()
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
