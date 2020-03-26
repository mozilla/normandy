import urllib.parse as urlparse
from urllib.parse import urlencode

from django.conf import settings

from rest_framework import serializers

from normandy.base.api.v1.serializers import UserSerializer
from normandy.recipes.api.fields import ActionImplementationHyperlinkField, SortedListField
from normandy.recipes.models import Action, ApprovalRequest, Recipe, RecipeRevision, Signature


class SignatureSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(read_only=True)
    signature = serializers.ReadOnlyField()
    x5u = serializers.SerializerMethodField()
    public_key = serializers.ReadOnlyField()

    class Meta:
        model = Signature
        fields = ["timestamp", "signature", "x5u", "public_key"]

    def get_x5u(self, signature):
        x5u = signature.x5u

        # Add cachebust parameter to x5u URL.
        if x5u is not None and settings.AUTOGRAPH_X5U_CACHE_BUST is not None:
            url_parts = list(urlparse.urlparse(x5u))
            query = urlparse.parse_qs(url_parts[4])
            query["cachebust"] = settings.AUTOGRAPH_X5U_CACHE_BUST
            url_parts[4] = urlencode(query)
            return urlparse.urlunparse(url_parts)

        return x5u


class ActionSerializer(serializers.ModelSerializer):
    arguments_schema = serializers.JSONField()
    implementation_url = ActionImplementationHyperlinkField()

    class Meta:
        model = Action
        fields = ["name", "implementation_url", "arguments_schema"]


class SignedActionSerializer(serializers.ModelSerializer):
    signature = SignatureSerializer()
    action = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = ["signature", "action"]

    def get_action(self, action):
        # `action` here is the main object for the serializer.
        return ActionSerializer(action).data


class ApprovalRequestSerializer(serializers.ModelSerializer):
    created = serializers.DateTimeField(read_only=True)
    creator = UserSerializer()
    approver = UserSerializer()

    class Meta:
        model = ApprovalRequest
        fields = ["id", "created", "creator", "approved", "approver", "comment"]


class RecipeSerializer(serializers.ModelSerializer):
    """Serializer used in the v1 API.

    Because the v1 API exists mostly to serve Firefox, the main use
    for this is to serialize approved, enabled recipes. However, the
    API we serve still tries to be "complete" and allows you to
    request e.g. disabled recipes. For this reason, serialization has
    to be robust against whether a recipe is approved or not. We deal
    with this by serializing recipes using the approved_revision (if
    one exists) or the latest_revision otherwise. This is done by
    overriding to_representation, but we keep the typical DRF fields
    information for the future where we limit the API to only
    serializing enabled recipes.

    """

    enabled = serializers.BooleanField(source="approved_revision.enabled", default=False)
    last_updated = serializers.DateTimeField(read_only=True, source="current_revision.updated")
    revision_id = serializers.IntegerField(read_only=True, source="current_revision.id")
    name = serializers.CharField(source="current_revision.name")
    action = serializers.SlugRelatedField(
        slug_field="name", source="current_revision.action", queryset=Action.objects.all()
    )
    arguments = serializers.JSONField(source="current_revision.arguments")
    filter_expression = serializers.CharField(
        read_only=True, source="current_revision.filter_expression"
    )
    latest_revision_id = serializers.IntegerField(source="latest_revision.id", read_only=True)
    approved_revision_id = serializers.IntegerField(
        source="approved_revision.id", default=None, read_only=True
    )
    approval_request = ApprovalRequestSerializer(
        read_only=True, default=None, source="latest_revision.approval_request"
    )
    identicon_seed = serializers.CharField(
        required=False, source="current_revision.identicon_seed"
    )
    capabilities = SortedListField(
        child=serializers.CharField(), source="current_revision.capabilities"
    )

    def to_representation(self, recipe):
        approved_revision = recipe.approved_revision
        latest_revision = recipe.latest_revision
        current_revision = approved_revision or latest_revision

        try:
            approval_request = latest_revision.approval_request
        except ApprovalRequest.DoesNotExist:
            approval_request = None

        return {
            "id": recipe.id,
            "last_updated": self.fields["last_updated"].to_representation(
                current_revision.updated
            ),
            "name": current_revision.name,
            "enabled": approved_revision.enabled if approved_revision else False,
            "is_approved": approved_revision is not None,
            "revision_id": current_revision.id,
            "action": current_revision.action.name,
            "arguments": self.fields["arguments"].to_representation(current_revision.arguments),
            "filter_expression": current_revision.filter_expression,
            "latest_revision_id": latest_revision.id,
            "approved_revision_id": approved_revision and approved_revision.id,
            "approval_request": approval_request
            and self.fields["approval_request"].to_representation(approval_request),
            "identicon_seed": current_revision.identicon_seed,
            "capabilities": self.fields["capabilities"].to_representation(
                current_revision.capabilities
            ),
        }

    class Meta:
        model = Recipe
        fields = [
            "id",
            "last_updated",
            "name",
            "enabled",
            "is_approved",
            "revision_id",
            "action",
            "arguments",
            "filter_expression",
            "latest_revision_id",
            "approved_revision_id",
            "approval_request",
            "identicon_seed",
            "capabilities",
        ]


class MinimalRecipeSerializer(RecipeSerializer):
    """
    The minimum amount of fields needed for clients to verify and execute recipes.

    This is only used for enabled recipes.
    """

    revision_id = serializers.SerializerMethodField()
    uses_only_baseline_capabilities = serializers.BooleanField(
        source="approved_revision.uses_only_baseline_capabilities", read_only=True
    )

    def to_representation(self, recipe):
        # FIXME: we have to re-override this to get around the
        # override in RecipeSerializer
        approved_revision = recipe.approved_revision
        if not approved_revision:
            raise ValueError("cannot serialize recipe as for signing unless it has been approved")

        return {
            "id": recipe.id,
            "name": approved_revision.name,
            # Certain parts of Telemetry expect this to be a string, so coerce it to
            # that, even though the data is actually an int
            "revision_id": str(approved_revision.id),
            "action": approved_revision.action.name,
            "arguments": approved_revision.arguments,
            "filter_expression": approved_revision.filter_expression,
            "capabilities": sorted(approved_revision.capabilities),
            "uses_only_baseline_capabilities": approved_revision.uses_only_baseline_capabilities(),
        }

    class Meta(RecipeSerializer.Meta):
        # Attributes serialized here are made available to filter expressions via
        # normandy.recipe, and should be documented if they are intended to be
        # used in filter expressions.
        fields = [
            "id",
            "name",
            "revision_id",
            "action",
            "arguments",
            "filter_expression",
            "capabilities",
            "uses_only_baseline_capabilities",
        ]


class RecipeRevisionSerializer(serializers.ModelSerializer):
    date_created = serializers.DateTimeField(source="created", read_only=True)
    recipe = RecipeSerializer(source="serializable_recipe", read_only=True)
    comment = serializers.CharField(read_only=True)
    approval_request = ApprovalRequestSerializer(read_only=True)

    class Meta:
        model = RecipeRevision
        fields = ["id", "date_created", "recipe", "comment", "approval_request"]


class ClientSerializer(serializers.Serializer):
    country = serializers.CharField()
    request_time = serializers.DateTimeField()


class SignedRecipeSerializer(serializers.ModelSerializer):
    signature = SignatureSerializer()
    recipe = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = ["signature", "recipe"]

    def get_recipe(self, recipe):
        # `recipe` here is the main object for the serializer.
        return MinimalRecipeSerializer(recipe).data
