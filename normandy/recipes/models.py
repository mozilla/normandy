import hashlib
import json
import logging

from django.contrib.auth.models import User
from django.db import models, transaction
from django.utils import timezone
from django.utils.functional import cached_property

from dirtyfields import DirtyFieldsMixin
from rest_framework.reverse import reverse
from reversion import revisions as reversion

from normandy.base.api.renderers import CanonicalJSONRenderer
from normandy.base.utils import get_client_ip
from normandy.recipes.geolocation import get_country_code
from normandy.recipes.utils import Autographer
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


class Approval(models.Model):
    created = models.DateTimeField(default=timezone.now)
    creator = models.ForeignKey(User)


class Signature(models.Model):
    signature = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
    public_key = models.TextField()
    x5u = models.TextField(null=True)


class RecipeQuerySet(models.QuerySet):
    def update_signatures(self):
        """
        Update the signatures on all Recipes in the queryset.
        """
        autographer = Autographer()
        # Convert to a list because order must be preserved
        recipes = list(self)
        canonical_jsons = [r.canonical_json() for r in recipes]
        signatures = autographer.sign_data(canonical_jsons)

        for recipe, signature in zip(recipes, signatures):
            recipe.signature = signature
            recipe.save()


@reversion.register()
class Recipe(DirtyFieldsMixin, models.Model):
    """A set of actions to be fetched and executed by users."""
    objects = RecipeQuerySet.as_manager()

    name = models.CharField(max_length=255, unique=True)
    revision_id = models.IntegerField(default=0, editable=False)
    last_updated = models.DateTimeField(default=timezone.now)

    action = models.ForeignKey('Action')
    arguments_json = models.TextField(default='{}', validators=[validate_json])

    # Fields that determine who this recipe is sent to.
    enabled = models.BooleanField(default=False)
    filter_expression = models.TextField(blank=False)
    approval = models.OneToOneField(Approval, related_name='recipe', null=True, blank=True)

    signature = models.OneToOneField(Signature, related_name='recipe', null=True, blank=True)

    # A tuple of fields that can be edited without causing the recipe to be disabled
    EDITABLE_FIELDS_WHITELIST = ('name', 'enabled', 'approval', 'last_updated', 'signature')

    class Meta:
        ordering = ['-enabled', '-last_updated']

    class IsNotApproved(Exception):
        pass

    @property
    def is_approved(self):
        return self.approval is not None

    @property
    def arguments(self):
        return json.loads(self.arguments_json)

    @arguments.setter
    def arguments(self, value):
        self.arguments_json = json.dumps(value)

    @property
    def current_approval_request(self):
        try:
            return self.approval_requests.get(active=True)
        except ApprovalRequest.DoesNotExist:
            return None

    def enable(self):
        self.enabled = True

    def disable(self):
        self.enabled = False
        self.approval = None

    _registered_matchers = []

    def __repr__(self):
        return '<Recipe "{name}">'.format(name=self.name)

    def __str__(self):
        return self.name

    def save(self, *args, skip_last_updated=False, **kwargs):
        # Increment the revision ID and save the reversion if we've
        # changed
        if self.is_dirty(check_relationship=True):
            dirty_fields = self.get_dirty_fields(check_relationship=True)

            # Any change will invalid the signature
            dirty_field_names = list(dirty_fields.keys())
            if dirty_field_names != ['signature'] and self.signature is not None:
                self.signature.delete()

            # Check for changes that should disable the recipe
            for field in self.EDITABLE_FIELDS_WHITELIST:
                if field in dirty_fields:
                    dirty_fields.pop(field)
            if dirty_fields:
                self.disable()

            # Increment the revision ID
            self.revision_id += 1
            if reversion.is_active():
                reversion.add_to_revision(self)

            # Set last_updated
            if not skip_last_updated:
                self.last_updated = timezone.now()

        super().save(*args, **kwargs)

    def canonical_json(self):
        from normandy.recipes.api.serializers import RecipeSerializer  # Avoid circular import
        data = RecipeSerializer(self).data
        return CanonicalJSONRenderer().render(data)


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


class ApprovalRequest(models.Model):
    recipe = models.ForeignKey(Recipe, related_name='approval_requests')
    created = models.DateTimeField(default=timezone.now)
    creator = models.ForeignKey(User)
    active = models.BooleanField(default=True)
    approval = models.OneToOneField(Approval, null=True, related_name='approval_request')

    class Meta:
        ordering = ('-created',)

    class IsNotActive(Exception):
        pass

    class ActiveRequestAlreadyExists(Exception):
        pass

    @property
    def is_approved(self):
        return self.approval is not None

    @transaction.atomic
    def approve(self, user):
        if self.active:
            approval = Approval(creator=user)
            approval.save()

            self.approval = approval
            self.active = False
            self.save()

            self.recipe.approval = approval
            self.recipe.save()
        else:
            raise self.IsNotActive('Approval request has already been closed.')

    def reject(self):
        if self.active:
            self.active = False
            self.save()
        else:
            raise self.IsNotActive('Approval request has already been closed.')

    def save(self, *args, **kwargs):
        open_approval_requests = self.recipe.approval_requests.filter(active=True)

        if self.pk:
            open_approval_requests = open_approval_requests.exclude(pk=self.pk)

        if self.active and open_approval_requests.exists():
            raise self.ActiveRequestAlreadyExists('A recipe can only have one active approval '
                                                  'request.')

        super().save(*args, **kwargs)


class ApprovalRequestComment(models.Model):
    approval_request = models.ForeignKey(ApprovalRequest, related_name='comments')
    created = models.DateTimeField(default=timezone.now)
    creator = models.ForeignKey(User)
    text = models.TextField()
