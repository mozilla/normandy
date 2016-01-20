import logging

from django.contrib.postgres.fields import JSONField
from django.db import models

from adminsortable.models import SortableMixin
from django_countries.fields import CountryField

from normandy.recipes.fields import AutoHashField, LocaleField, PercentField
from normandy.recipes import utils

logger = logging.getLogger()


class Recipe(models.Model):
    """A set of actions to be fetched and executed by users."""
    name = models.CharField(max_length=255, unique=True)
    actions = models.ManyToManyField('Action', through='RecipeAction')

    # Fields that determine who this recipe is sent to.
    enabled = models.BooleanField(default=False)
    locale = LocaleField(blank=True, default='')
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

        if self.locale and self.locale != client.locale:
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
    name = models.CharField(max_length=255, unique=True)

    implementation = models.TextField()
    implementation_hash = AutoHashField('implementation', unique=True)

    def __str__(self):
        return self.name


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
