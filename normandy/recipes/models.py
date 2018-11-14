import json
import logging
from collections import defaultdict

from django.conf import settings
from django.contrib.auth.models import User
from django.core.exceptions import ImproperlyConfigured, ValidationError
from django.db import models, transaction
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.functional import cached_property

from dirtyfields import DirtyFieldsMixin
from rest_framework import serializers
from rest_framework.reverse import reverse

from normandy.base.api.renderers import CanonicalJSONRenderer
from normandy.base.utils import filter_m2m, get_client_ip, sri_hash
from normandy.recipes import filters
from normandy.recipes.decorators import approved_revision_property, current_revision_property
from normandy.recipes.geolocation import get_country_code
from normandy.recipes.signing import Autographer
from normandy.recipes.exports import RemoteSettings
from normandy.recipes.validators import validate_json
from normandy.recipes.fields import IdenticonSeedField


INFO_REQUESTING_RECIPE_SIGNATURES = "normandy.recipes.I001"
INFO_CREATE_REVISION = "normandy.recipes.I002"
INFO_REQUESTING_ACTION_SIGNATURES = "normandy.recipes.I003"
WARNING_BYPASSING_PEER_APPROVAL = "normandy.recipes.W001"


logger = logging.getLogger(__name__)


class Channel(models.Model):
    slug = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255)

    class Meta:
        ordering = ("slug",)

    def __repr__(self):
        return "<Channel {}>".format(self.slug)


class Country(models.Model):
    code = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255)

    class Meta:
        ordering = ("name",)

    def __repr__(self):
        return "<Country {}>".format(self.code)


class Locale(models.Model):
    code = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255)

    class Meta:
        ordering = ("name",)

    def __repr__(self):
        return "<Locale {}>".format(self.code)


class Signature(models.Model):
    signature = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
    public_key = models.TextField()
    x5u = models.TextField(null=True)


class RecipeQuerySet(models.QuerySet):
    def only_enabled(self):
        return self.filter(approved_revision__enabled_state__enabled=True)

    def only_disabled(self):
        return self.exclude(approved_revision__enabled_state__enabled=True)


class Recipe(DirtyFieldsMixin, models.Model):
    """A set of actions to be fetched and executed by users."""

    objects = RecipeQuerySet.as_manager()

    latest_revision = models.ForeignKey(
        "RecipeRevision", null=True, on_delete=models.SET_NULL, related_name="latest_for_recipe"
    )
    approved_revision = models.ForeignKey(
        "RecipeRevision", null=True, on_delete=models.SET_NULL, related_name="approved_for_recipe"
    )
    signature = models.OneToOneField(
        Signature, related_name="recipe", null=True, blank=True, on_delete=models.CASCADE
    )

    class Meta:
        ordering = ["-approved_revision__enabled_state__enabled", "-latest_revision__updated"]

    class NotApproved(Exception):
        pass

    def __repr__(self):
        return '<Recipe "{name}">'.format(name=self.name)

    def __str__(self):
        return self.name

    @property
    def current_revision(self):
        return self.approved_revision or self.latest_revision

    @property
    def is_approved(self):
        return self.approved_revision is not None

    @approved_revision_property(default=False)
    def enabled(self):
        return self.approved_revision.enabled

    @current_revision_property()
    def name(self):
        return self.current_revision.name

    @current_revision_property()
    def action(self):
        return self.current_revision.action

    @current_revision_property()
    def filter_expression(self):
        return self.current_revision.filter_expression

    @current_revision_property()
    def extra_filter_expression(self):
        return self.current_revision.extra_filter_expression

    @current_revision_property()
    def filter_object(self):
        return self.current_revision.filter_object

    @current_revision_property()
    def arguments_json(self):
        return self.current_revision.arguments_json

    @current_revision_property()
    def arguments(self):
        return self.current_revision.arguments

    @current_revision_property()
    def revision_id(self):
        return self.current_revision.id

    @current_revision_property()
    def last_updated(self):
        return self.current_revision.updated

    @current_revision_property()
    def channels(self):
        return self.current_revision.channels

    @current_revision_property()
    def countries(self):
        return self.current_revision.countries

    @current_revision_property()
    def locales(self):
        return self.current_revision.locales

    @current_revision_property()
    def identicon_seed(self):
        return self.current_revision.identicon_seed

    @current_revision_property()
    def comment(self):
        return self.current_revision.comment

    @current_revision_property()
    def bug_number(self):
        return self.current_revision.bug_number

    @property
    def approval_request(self):
        try:
            return self.latest_revision.approval_request if self.latest_revision else None
        except ApprovalRequest.DoesNotExist:
            return None

    def canonical_json(self):
        # Avoid circular import
        from normandy.recipes.api.v1.serializers import MinimalRecipeSerializer

        data = MinimalRecipeSerializer(self).data
        return CanonicalJSONRenderer().render(data)

    def update_signature(self):
        try:
            autographer = Autographer()
        except ImproperlyConfigured:
            self.signature = None
            return

        # Don't sign recipe that aren't enabled
        if not self.enabled:
            return

        logger.info(
            f"Requesting signature for recipe with id {self.id} from Autograph",
            extra={"code": INFO_REQUESTING_RECIPE_SIGNATURES, "recipe_ids": [self.id]},
        )

        signature_data = autographer.sign_data([self.canonical_json()])[0]
        signature = Signature(**signature_data)
        signature.save()
        self.signature = signature

    @transaction.atomic
    def revise(self, force=False, **data):
        revision = self.latest_revision

        if "arguments" in data:
            data["arguments_json"] = json.dumps(data.pop("arguments"))

        if "filter_object" in data:
            data["filter_object_json"] = json.dumps(data.pop("filter_object"))

        if revision:
            revisions = RecipeRevision.objects.filter(id=revision.id)

            revision_data = revision.data
            revision_data.update(data)

            channels = revision_data.pop("channels")
            revisions = filter_m2m(revisions, "channels", channels)

            countries = revision_data.pop("countries")
            revisions = filter_m2m(revisions, "countries", countries)

            locales = revision_data.pop("locales")
            revisions = filter_m2m(revisions, "locales", locales)

            data = revision_data
            revisions = revisions.filter(**data)

            is_clean = revisions.exists()
        else:
            channels = data.pop("channels", [])
            countries = data.pop("countries", [])
            locales = data.pop("locales", [])
            is_clean = False

        if not is_clean or force:
            logger.info(
                f"Creating new revision for recipe ID [{self.id}]",
                extra={"code": INFO_CREATE_REVISION},
            )

            if revision and revision.approval_status == RecipeRevision.PENDING:
                revision.approval_request.delete()

            self.latest_revision = RecipeRevision.objects.create(
                recipe=self, parent=revision, **data
            )

            for channel in channels:
                self.latest_revision.channels.add(channel)

            for country in countries:
                self.latest_revision.countries.add(country)

            for locale in locales:
                self.latest_revision.locales.add(locale)

            self.save()

    @transaction.atomic
    def save(self, *args, **kwargs):
        dirty_fields = {
            k: v
            for k, v in self.get_dirty_fields(check_relationship=True, verbose=True).items()
            if v["saved"] != v["current"]
        }

        if dirty_fields:
            dirty_field_names = list(dirty_fields.keys())

            if (
                len(dirty_field_names) > 1
                and "signature" in dirty_field_names
                and self.signature is not None
            ):
                # Setting the signature while also changing something else is probably
                # going to make the signature immediately invalid. Don't allow it.
                raise ValidationError("Signatures must change alone")

            if dirty_field_names != ["signature"]:
                super().save(*args, **kwargs)
                kwargs["force_insert"] = False

                self.update_signature()

        super().save(*args, **kwargs)


class RecipeRevision(DirtyFieldsMixin, models.Model):
    APPROVED = "approved"
    REJECTED = "rejected"
    PENDING = "pending"

    # Bookkeeping fields
    parent = models.OneToOneField(
        "self", null=True, on_delete=models.CASCADE, related_name="child"
    )
    recipe = models.ForeignKey(Recipe, related_name="revisions", on_delete=models.CASCADE)
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(default=timezone.now)
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, related_name="recipe_revisions", null=True
    )

    # Recipe fields
    name = models.CharField(max_length=255)
    action = models.ForeignKey("Action", related_name="recipe_revisions", on_delete=models.CASCADE)
    arguments_json = models.TextField(default="{}", validators=[validate_json])
    extra_filter_expression = models.TextField(blank=False)
    filter_object_json = models.TextField(validators=[validate_json], null=True)
    channels = models.ManyToManyField(Channel)
    countries = models.ManyToManyField(Country)
    locales = models.ManyToManyField(Locale)
    identicon_seed = IdenticonSeedField(max_length=64)
    enabled_state = models.ForeignKey(
        "EnabledState", null=True, on_delete=models.SET_NULL, related_name="current_for_revision"
    )
    comment = models.TextField()
    bug_number = models.IntegerField(null=True)

    class Meta:
        ordering = ("-created",)

    @property
    def data(self):
        return {
            "name": self.name,
            "action": self.action,
            "arguments_json": self.arguments_json,
            "extra_filter_expression": self.extra_filter_expression,
            "filter_object_json": self.filter_object_json,
            "channels": list(self.channels.all()) if self.id else [],
            "countries": list(self.countries.all()) if self.id else [],
            "locales": list(self.locales.all()) if self.id else [],
            "identicon_seed": self.identicon_seed,
            "comment": self.comment,
            "bug_number": self.bug_number,
        }

    @property
    def filter_expression(self):
        parts = []

        if self.locales.count():
            locales = ", ".join(["'{}'".format(l.code) for l in self.locales.all()])
            parts.append("normandy.locale in [{}]".format(locales))

        if self.countries.count():
            countries = ", ".join(["'{}'".format(c.code) for c in self.countries.all()])
            parts.append("normandy.country in [{}]".format(countries))

        if self.channels.count():
            channels = ", ".join(["'{}'".format(c.slug) for c in self.channels.all()])
            parts.append("normandy.channel in [{}]".format(channels))

        for obj in self.filter_object:
            filter = filters.from_data(obj)
            parts.append(filter.to_jexl())

        if self.extra_filter_expression:
            parts.append(self.extra_filter_expression)

        expression = ") && (".join(parts)

        return "({})".format(expression) if len(parts) > 1 else expression

    @property
    def filter_object(self):
        if self.filter_object_json is not None:
            return json.loads(self.filter_object_json)
        else:
            return []

    @property
    def arguments(self):
        return json.loads(self.arguments_json)

    @arguments.setter
    def arguments(self, value):
        self.arguments_json = json.dumps(value)

    @property
    def serializable_recipe(self):
        """Returns an unsaved recipe object with this revision's data to be serialized."""
        recipe = self.recipe
        recipe.approved_revision = self if self.approval_status == self.APPROVED else None
        recipe.latest_revision = self
        return recipe

    @property
    def approval_status(self):
        try:
            if self.approval_request.approved is True:
                return self.APPROVED
            elif self.approval_request.approved is False:
                return self.REJECTED
            else:
                return self.PENDING
        except ApprovalRequest.DoesNotExist:
            return None

    @property
    def enabled(self):
        return self.enabled_state.enabled if self.enabled_state else False

    def save(self, *args, **kwargs):
        self.action.validate_arguments(self.arguments, self)

        if not self.created:
            self.created = timezone.now()
        self.updated = timezone.now()
        super().save(*args, **kwargs)

    def request_approval(self, creator):
        approval_request = ApprovalRequest(revision=self, creator=creator)
        approval_request.save()
        self.recipe.update_signature()
        self.recipe.save()
        return approval_request

    def _create_new_enabled_state(self, **kwargs):
        if self.recipe.approved_revision != self:
            raise EnabledState.NotActionable(
                "You cannot change the enabled state of a revision"
                "that is not the latest approved revision."
            )

        self.enabled_state = EnabledState.objects.create(revision=self, **kwargs)
        self.save()

        self.recipe.approved_revision.refresh_from_db()
        self.recipe.update_signature()
        self.recipe.save()

    def enable(self, user, carryover_from=None):
        if self.enabled:
            raise EnabledState.NotActionable("This revision is already enabled.")

        self._create_new_enabled_state(creator=user, enabled=True, carryover_from=carryover_from)

        RemoteSettings().publish(self.recipe)

    def disable(self, user):
        if not self.enabled:
            raise EnabledState.NotActionable("This revision is already disabled.")

        self._create_new_enabled_state(creator=user, enabled=False)

        RemoteSettings().unpublish(self.recipe)


class EnabledState(models.Model):
    revision = models.ForeignKey(
        RecipeRevision, related_name="enabled_states", on_delete=models.CASCADE
    )
    created = models.DateTimeField(default=timezone.now)
    creator = models.ForeignKey(
        User, on_delete=models.SET_NULL, related_name="enabled_states", null=True
    )
    enabled = models.BooleanField(default=False)
    carryover_from = models.ForeignKey(
        "self", null=True, on_delete=models.SET_NULL, related_name="carryover_to"
    )

    class Meta:
        ordering = ("-created",)

    class NotActionable(Exception):
        pass


class ApprovalRequest(models.Model):
    revision = models.OneToOneField(
        RecipeRevision, related_name="approval_request", on_delete=models.CASCADE
    )
    created = models.DateTimeField(default=timezone.now)
    creator = models.ForeignKey(
        User, on_delete=models.SET_NULL, related_name="approval_requests", null=True
    )
    approved = models.NullBooleanField(null=True)
    approver = models.ForeignKey(
        User, on_delete=models.SET_NULL, related_name="approved_requests", null=True
    )
    comment = models.TextField(null=True)

    class Meta:
        ordering = ("id",)

    class NotActionable(Exception):
        pass

    class CannotActOnOwnRequest(Exception):
        pass

    def verify_approver(self, approver):
        if approver == self.creator:
            if settings.PEER_APPROVAL_ENFORCED:
                raise self.CannotActOnOwnRequest()
            else:
                logger.warning(
                    "Bypassing peer approver verification because it is disabled.",
                    extra={
                        "code": WARNING_BYPASSING_PEER_APPROVAL,
                        "approval_id": self.id,
                        "approver": approver,
                    },
                )

    def approve(self, approver, comment):
        if self.approved is not None:
            raise self.NotActionable()

        self.verify_approver(approver)

        self.approved = True
        self.approver = approver
        self.comment = comment
        self.save()

        recipe = self.revision.recipe

        # Check if the recipe is enabled we should carry over it's enabled state
        carryover_enabled = None
        if recipe.enabled:
            carryover_enabled = recipe.approved_revision.enabled_state

        recipe.approved_revision = self.revision
        recipe.save()

        # Note: Enabling the new revision must happen after the approved_revision has been updated
        if carryover_enabled:
            self.revision.enable(approver, carryover_from=carryover_enabled)

    def reject(self, approver, comment):
        if self.approved is not None:
            raise self.NotActionable()

        self.verify_approver(approver)

        self.approved = False
        self.approver = approver
        self.comment = comment
        self.save()

        recipe = self.revision.recipe
        recipe.update_signature()
        recipe.save()

    def close(self):
        self.delete()

        recipe = self.revision.recipe
        recipe.update_signature()
        recipe.save()


class Action(DirtyFieldsMixin, models.Model):
    """A single executable action that can take arguments."""

    name = models.SlugField(max_length=255, unique=True)
    implementation = models.TextField(null=True)
    implementation_hash = models.CharField(max_length=71, editable=False, null=True)
    arguments_schema_json = models.TextField(default="{}", validators=[validate_json])
    signature = models.OneToOneField(
        Signature, related_name="action", null=True, blank=True, on_delete=models.CASCADE
    )

    class Meta:
        ordering = ("id",)

    errors = {
        "duplicate_branch_slug": "Feature branch slugs must be unique within an experiment",
        "duplicate_branch_value": "Feature branch values must be unique within an experiment",
        "duplicate_experiment_slug": "Experiment slugs must be globally unique",
        "duplicate_rollout_slug": "Rollout slugs must be globally unique",
        "rollout_slug_not_found": "Rollout slug not found for rollback",
    }

    @property
    def arguments_schema(self):
        return json.loads(self.arguments_schema_json)

    @arguments_schema.setter
    def arguments_schema(self, value):
        self.arguments_schema_json = json.dumps(value)

    @property
    def recipes_used_by(self):
        """Set of enabled recipes that are using this action."""
        return Recipe.objects.only_enabled().filter(
            latest_revision_id__in=self.recipe_revisions.values_list("id", flat=True)
        )

    def recipes_used_by_html(self):
        return render_to_string(
            "admin/field_recipe_list.html",
            {"recipes": self.recipes_used_by.order_by("latest_revision__name")},
        )

    recipes_used_by_html.short_description = "Used in Recipes"

    def __str__(self):
        return self.name

    def canonical_json(self):
        # Avoid circular import
        from normandy.recipes.api.v1.serializers import ActionSerializer

        data = ActionSerializer(self).data
        return CanonicalJSONRenderer().render(data)

    def get_absolute_url(self):
        return reverse("action-detail", args=[self.name])

    def compute_implementation_hash(self):
        # User Sub Resource Integrity because the implementation is a
        # subresource, and SRI includes the algorithm in the format,
        # so this is robust to future changes in both client and
        # server.
        return sri_hash(self.implementation.encode(), url_safe=True)

    def update_signature(self):
        try:
            autographer = Autographer()
        except ImproperlyConfigured:
            self.signature = None
            return

        logger.info(
            f"Requesting signature for action named {self.name} from Autograph",
            extra={"code": INFO_REQUESTING_ACTION_SIGNATURES, "action_names": [self.name]},
        )

        signature_data = autographer.sign_data([self.canonical_json()])[0]
        signature = Signature(**signature_data)
        signature.save()
        self.signature = signature

    @transaction.atomic
    def save(self, *args, **kwargs):
        dirty_fields = {
            k: v
            for k, v in self.get_dirty_fields(check_relationship=True, verbose=True).items()
            if v["saved"] != v["current"]
        }
        if dirty_fields:
            dirty_field_names = list(dirty_fields.keys())

            if (
                len(dirty_field_names) > 1
                and "signature" in dirty_field_names
                and self.signature is not None
            ):
                # Setting the signature while also changing something else is probably
                # going to make the signature immediately invalid. Don't allow it.
                raise ValidationError("Signatures must change alone")

            if dirty_field_names != ["signature"]:
                super().save(*args, **kwargs)
                kwargs["force_insert"] = False

                if self.implementation:
                    self.implementation_hash = self.compute_implementation_hash()
                self.update_signature()

        super().save(*args, **kwargs)

    def validate_arguments(self, arguments, revision):
        """
        Test if `arguments` follows all action-specific rules.

        Raises `ValidationError` if any rules are violated.
        """
        # Make a default dict that always returns a default dict
        def default():
            return defaultdict(default)

        errors = default()

        if self.name == "preference-experiment":
            # Feature branch slugs should be unique within an experiment.
            branch_slugs = set()
            branch_values = set()
            for i, branch in enumerate(arguments.get("branches")):
                if branch["slug"] in branch_slugs:
                    msg = self.errors["duplicate_branch_slug"]
                    errors["branches"][i]["slug"] = msg

                if branch["value"] in branch_values:
                    msg = self.errors["duplicate_branch_value"]
                    errors["branches"][i]["value"] = msg

                branch_slugs.add(branch["slug"])
                branch_values.add(branch["value"])

            # Experiment slugs should be unique.
            experiment_recipes = Recipe.objects.filter(latest_revision__action=self)
            if revision.recipe and revision.recipe.id:
                experiment_recipes = experiment_recipes.exclude(id=revision.recipe.id)
            existing_slugs = set(r.arguments.get("slug") for r in experiment_recipes)
            if arguments.get("slug") in existing_slugs:
                msg = self.errors["duplicate_experiment_slug"]
                errors["slug"] = msg

        elif self.name == "preference-rollout":
            # Rollout slugs should be unique
            rollout_recipes = Recipe.objects.filter(latest_revision__action=self)
            if revision.recipe and revision.recipe.id:
                rollout_recipes = rollout_recipes.exclude(id=revision.recipe.id)
            existing_slugs = set(r.arguments.get("slug") for r in rollout_recipes)
            if arguments.get("slug") in existing_slugs:
                msg = self.errors["duplicate_rollout_slug"]
                errors["slug"] = msg

        elif self.name == "preference-rollback":
            # Rollback slugs should match rollouts
            rollouts = Recipe.objects.filter(latest_revision__action__name="preference-rollout")
            rollout_slugs = set(r.arguments["slug"] for r in rollouts)
            if arguments["rolloutSlug"] not in rollout_slugs:
                errors["slug"] = self.errors["rollout_slug_not_found"]

        # Raise errors, if any
        if errors:
            raise serializers.ValidationError({"arguments": errors})


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
