import hashlib
import logging
from contextlib import closing
from urllib.parse import urljoin

from django.conf import settings
from django.contrib.postgres.fields import JSONField
from django.db import models

from adminsortable.models import SortableMixin
from django_countries.fields import CountryField

from normandy.recipes.fields import PercentField
from normandy.recipes import utils


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

    @property
    def implementation(self):
        return ';'.join(action.implementation for action in self.actions.all())

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


def action_implementation_filename(instance, filename):
    return 'actions/{instance.name}.js'.format(instance=instance)


class Action(models.Model):
    """A single executable action that can take arguments."""
    name = models.SlugField(max_length=255, unique=True)

    implementation = models.FileField(upload_to=action_implementation_filename)
    implementation_hash = models.CharField(max_length=40, editable=False, unique=True)

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        return self.implementation.url

    def save(self, *args, **kwargs):
        # Save first so the upload is available.
        super().save(*args, **kwargs)

        # Update hash
        with closing(self.implementation) as f:
            self.implementation_hash = hashlib.sha1(f.read()).hexdigest()
        super().save(update_fields=['implementation_hash'])


class RecipeAction(SortableMixin):
    """
    An instance of an action within a recipe with associated arguments.
    """
    recipe = models.ForeignKey(Recipe)
    action = models.ForeignKey(Action)
    arguments = JSONField(default=dict, blank=True)
    order = models.PositiveIntegerField(default=0, editable=False, db_index=True)

    class Meta:
        ordering = ['order']
