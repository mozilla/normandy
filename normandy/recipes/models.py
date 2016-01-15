import logging

from django.contrib.postgres.fields import JSONField
from django.db import models

from adminsortable.models import SortableMixin
from django_countries.fields import CountryField

from normandy.counters import get_counter
from normandy.recipes.fields import AutoHashField, LocaleField, PercentField

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
    count_limit = models.PositiveIntegerField(blank=True, null=True, default=None)

    @property
    def implementation(self):
        return ';'.join(action.implementation for action in self.actions.all())

    def log_rejection(self, client=None, field=None, msg=None, op='!='):
        if msg is None:
            msg = (
                'recipe {field} ({recipe!r}) != client {field} ({client!r})'
                .format(
                    field=field,
                    recipe=getattr(self, field),
                    client=getattr(client, field)))
        logger.debug('{} rejected: {}'.format(self, msg))

    def matches(self, client):
        """
        Return whether this Recipe should be sent to the given client.
        """
        if not self.enabled:
            self.log_rejection(msg='not enabled')
            return False

        if self.locale and self.locale != client.locale:
            self.log_rejection(client, 'locale')
            return False

        if self.country and self.country != client.country:
            self.log_rejection(client, 'country')
            return False

        if self.start_time and self.start_time > client.request_time:
            self.log_rejection(client, msg='start time not met ({})'.format(self.start_time))
            return False

        if self.end_time and self.end_time < client.request_time:
            self.log_rejection(msg='end time already passed ({})'.format(self.end_time))
            return False

        if self.sample_rate and random() > self.sample_rate:
            self.log_rejection(msg='did not match sample')
            return False

        if self.count_limit is not None and not get_counter().check(self):
            self.log_rejection(msg='over counter')
            return False

        return True

    def __repr__(self):
        return '<Recipe "{name}">'.format(name=self.name)

    def __str__(self):
        return self.name

    @property
    def has_counter(self):
        return self.count_limit is not None


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
