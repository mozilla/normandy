from random import random

from django.db import models

from django_countries.fields import CountryField

from normandy.counters import get_counter
from normandy.recipes.fields import AutoHashField, LocaleField, PercentField


class Recipe(models.Model):
    """A script to be fetched and executed by users."""
    filename = models.CharField(max_length=255, unique=True)
    content = models.TextField()
    content_hash = AutoHashField('content', unique=True)

    # Fields that determine who this recipe is sent to.
    enabled = models.BooleanField(default=False)
    locale = LocaleField(blank=True, default='')
    country = CountryField(blank=True, null=True, default=None)
    start_time = models.DateTimeField(blank=True, null=True, default=None)
    end_time = models.DateTimeField(blank=True, null=True, default=None)
    sample_rate = PercentField(default=100)
    count_limit = models.PositiveIntegerField(blank=True, null=True, default=None)

    def matches(self, client):
        """
        Return whether this Recipe should be sent to the given client.
        """
        if not self.enabled:
            return False

        if self.locale and self.locale != client.locale:
            return False

        if self.country and self.country != client.country:
            return False

        if self.start_time and self.start_time > client.request_time:
            return False

        if self.end_time and self.end_time < client.request_time:
            return False

        if self.sample_rate and random() > self.sample_rate:
            return False

        if self.count_limit is not None and not get_counter().check(self):
            return False

        return True

    def __repr__(self):
        return '<Recipe "{filename}">'.format(filename=self.filename)

    @property
    def has_counter(self):
        return self.count_limit is not None
