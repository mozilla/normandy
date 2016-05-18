import hashlib
import json
import logging

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone
from django.utils.functional import cached_property

from rest_framework.reverse import reverse
from reversion import revisions as reversion

from normandy.base.utils import get_client_ip
from normandy.recipes.geolocation import get_country_code
from normandy.recipes.validators import validate_json
from normandy.recipes.utils import Autographer


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


class ReleaseChannel(models.Model):
    """Release channel of Firefox"""
    slug = models.SlugField(max_length=255, unique=True)
    name = models.CharField(max_length=255)

    class Meta:
        ordering = ['slug']

    def __str__(self):
        return self.name


class Country(models.Model):
    """Database table for countries from django_countries."""
    code = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    order = models.IntegerField(default=100)

    class Meta:
        ordering = ['order', 'name']

    def __str__(self):
        return '{self.name} ({self.code})'.format(self=self)


@reversion.register()
class Recipe(models.Model):
    """A set of actions to be fetched and executed by users."""
    name = models.CharField(max_length=255, unique=True)
    revision_id = models.IntegerField(default=0, editable=False)

    action = models.ForeignKey('Action')
    arguments_json = models.TextField(default='{}', validators=[validate_json])

    # Fields that determine who this recipe is sent to.
    enabled = models.BooleanField(default=False)
    filter_expression = models.TextField(blank=False)
    approver = models.ForeignKey(User, null=True, blank=True)

    class IsNotApproved(Exception):
        pass

    @property
    def is_approved(self):
        return self.approver is not None

    @property
    def arguments(self):
        return json.loads(self.arguments_json)

    @arguments.setter
    def arguments(self, value):
        self.arguments_json = json.dumps(value)

    def enable(self):
        if self.is_approved:
            self.enabled = True
            self.save()
        else:
            raise self.IsNotApproved('You must approve a recipe before it can be enabled.')

    def disable(self, ignore_revision_id=False, *args, **kwargs):
        self.enabled = False
        self.approver = None
        self.save(ignore_revision_id=ignore_revision_id, *args, **kwargs)

    _registered_matchers = []

    def __repr__(self):
        return '<Recipe "{name}">'.format(name=self.name)

    def __str__(self):
        return self.name

    def save(self, ignore_revision_id=False, *args, **kwargs):
        if not ignore_revision_id:
            self.revision_id += 1
        super(Recipe, self).save(*args, **kwargs)


class ActionQuerySet(models.QuerySet):
    def update_signatures(self):
        """
        Update the signatures on all Actions in the queryset.
        """
        autographer = Autographer()
        # Convert to a list because order must be preserved
        actions = list(self)
        implementations = [a.implementation for a in actions]
        signatures = autographer.sign_data(implementations)

        for action, signature in zip(actions, signatures):
            action.signature = signature
            action.signature_timestamp = timezone.now()
            action.save()


@reversion.register()
class Action(models.Model):
    """A single executable action that can take arguments."""
    name = models.SlugField(max_length=255, unique=True)
    implementation = models.TextField()
    implementation_hash = models.CharField(max_length=40, editable=False)
    arguments_schema_json = models.TextField(default='{}', validators=[validate_json])
    signature = models.TextField(blank=True, null=True)
    signature_timestamp = models.DateTimeField(blank=True, null=True)

    objects = ActionQuerySet.as_manager()

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
        # Update hash
        old_hash = self.implementation_hash
        self.implementation_hash = self.compute_implementation_hash()

        # Invalidate signature if content has changed
        if self.implementation_hash != old_hash:
            self.signature = None
            self.signature_timestamp = None

        super().save(*args, **kwargs)


class Client(object):
    """A client attempting to fetch a set of recipes."""

    def __init__(self, request=None):
        self.request = request

    @cached_property
    def country(self):
        ip_address = get_client_ip(self.request)
        if ip_address is None:
            return None
        else:
            return get_country_code(ip_address)

    @cached_property
    def request_time(self):
        return self.request.received_at
