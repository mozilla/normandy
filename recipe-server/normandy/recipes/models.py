import hashlib
import json
import logging

from django.contrib.auth.models import User
from django.core.exceptions import ImproperlyConfigured
from django.db import models, transaction
from django.utils import timezone
from django.utils.functional import cached_property

from rest_framework.reverse import reverse
from reversion import revisions as reversion

from normandy.base.api.renderers import CanonicalJSONRenderer
from normandy.base.utils import get_client_ip
from normandy.recipes.geolocation import get_country_code
from normandy.recipes.utils import Autographer
from normandy.recipes.validators import validate_json


logger = logging.getLogger(__name__)


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

        recipe_ids = [r.id for r in recipes]
        logger.info(
            'Requesting signatures for recipes with ids [%s] from Autograph',
            (recipe_ids, ),
            extra={'recipe_ids': recipe_ids})

        canonical_jsons = [r.canonical_json() for r in recipes]
        signatures_data = autographer.sign_data(canonical_jsons)

        for recipe, sig_data in zip(recipes, signatures_data):
            signature = Signature(**sig_data)
            signature.save()
            recipe.signature = signature
            recipe.save()


class Recipe(models.Model):
    """A set of actions to be fetched and executed by users."""
    objects = RecipeQuerySet.as_manager()

    latest_revision = models.ForeignKey('RecipeRevision', null=True, on_delete=models.SET_NULL,
                                        related_name='latest_for_recipe')

    # Fields that determine who this recipe is sent to.
    enabled = models.BooleanField(default=False)
    signature = models.OneToOneField(Signature, related_name='recipe_revision', null=True,
                                     blank=True)

    class Meta:
        ordering = ['-enabled', '-latest_revision__updated']

    def __repr__(self):
        return '<Recipe "{name}">'.format(name=self.name)

    def __str__(self):
        return self.name

    @property
    def name(self):
        return self.latest_revision.name if self.latest_revision else None

    @property
    def action(self):
        return self.latest_revision.action if self.latest_revision else None

    @property
    def filter_expression(self):
        return self.latest_revision.filter_expression if self.latest_revision else None

    @property
    def arguments_json(self):
        return self.latest_revision.arguments_json if self.latest_revision else None

    @property
    def arguments(self):
        return self.latest_revision.arguments if self.latest_revision else None

    @property
    def revision_id(self):
        return self.latest_revision.id if self.latest_revision else None

    def canonical_json(self):
        from normandy.recipes.api.serializers import RecipeSerializer  # Avoid circular import
        data = RecipeSerializer(self).data
        return CanonicalJSONRenderer().render(data)

    def update_signature(self):
        autographer = Autographer()

        logger.info(
            'Requesting signatures for recipes with ids [%s] from Autograph',
            self.id,
            extra={'recipe_ids': [self.id]})

        signature_data = autographer.sign_data([self.canonical_json()])[0]
        signature = Signature(**signature_data)
        signature.save()
        self.signature = signature

    @transaction.atomic
    def update(self, force=False, **data):
        if self.latest_revision:
            is_clean = RecipeRevision.objects.filter(id=self.latest_revision.id, **data).exists()

            revision_data = self.latest_revision.data
            revision_data.update(data)
            data = revision_data
        else:
            is_clean = False

        if not is_clean or force:
            self.latest_revision = RecipeRevision.objects.create(
                recipe=self, parent=self.latest_revision, **data)

            try:
                self.update_signature()
            except ImproperlyConfigured:
                pass

            self.save()


class RecipeRevision(models.Model):
    id = models.CharField(max_length=64, primary_key=True)
    parent = models.OneToOneField('self', null=True, on_delete=models.CASCADE,
                                  related_name='child')
    recipe = models.ForeignKey(Recipe, related_name='revisions')
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(default=timezone.now)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='recipe_revisions',
                             null=True)
    comment = models.TextField()

    name = models.CharField(max_length=255)
    action = models.ForeignKey('Action')
    arguments_json = models.TextField(default='{}', validators=[validate_json])
    filter_expression = models.TextField(blank=False)

    @property
    def data(self):
        return {
            'name': self.name,
            'action': self.action,
            'arguments_json': self.arguments_json,
            'filter_expression': self.filter_expression,
        }

    @property
    def arguments(self):
        return json.loads(self.arguments_json)

    @arguments.setter
    def arguments(self, value):
        self.arguments_json = json.dumps(value)

    @property
    def restored_recipe(self):
        recipe = self.recipe
        recipe.latest_revision = self
        return recipe

    def save(self, *args, skip_updated=False, **kwargs):
        if not self.created:
            self.created = timezone.now()

        data = '{}{}{}{}{}{}'.format(self.recipe.id, self.created, self.name, self.action.id,
                                     self.arguments_json, self.filter_expression)
        self.id = hashlib.sha256(data.encode()).hexdigest()

        if not skip_updated:
            self.updated = timezone.now()

        super().save(*args, **kwargs)


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

    def __init__(self, request=None, **kwargs):
        self.request = request
        for key, value in kwargs.items():
            setattr(self, key, value)

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
