from pyjexl import JEXL
from rest_framework import serializers
from factory.fuzzy import FuzzyText

from normandy.base.api.serializers import UserSerializer
from normandy.recipes import filters
from normandy.recipes.api.fields import ActionImplementationHyperlinkField
from normandy.recipes.models import (
    Action,
    ApprovalRequest,
    EnabledState,
    Recipe,
    RecipeRevision,
    Signature,
)
from normandy.recipes.validators import JSONSchemaValidator


class CustomizableSerializerMixin:
    """Serializer Mixin that allows callers to exclude fields on instance of this serializer."""

    def __init__(self, *args, **kwargs):
        exclude_fields = kwargs.pop("exclude_fields", [])
        super().__init__(*args, **kwargs)

        if exclude_fields:
            for field in exclude_fields:
                self.fields.pop(field)


class ActionSerializer(serializers.ModelSerializer):
    arguments_schema = serializers.JSONField()
    implementation_url = ActionImplementationHyperlinkField()

    class Meta:
        model = Action
        fields = ["arguments_schema", "name", "id", "implementation_url"]


class ApprovalRequestSerializer(serializers.ModelSerializer):
    approver = UserSerializer()
    created = serializers.DateTimeField(read_only=True)
    creator = UserSerializer()

    class Meta:
        model = ApprovalRequest
        fields = ["approved", "approver", "comment", "created", "creator", "id"]


class EnabledStateSerializer(CustomizableSerializerMixin, serializers.ModelSerializer):
    creator = UserSerializer()

    class Meta:
        model = EnabledState
        fields = ["id", "revision_id", "created", "creator", "enabled", "carryover_from"]


class RecipeRevisionSerializer(serializers.ModelSerializer):
    action = serializers.SerializerMethodField(read_only=True)
    approval_request = ApprovalRequestSerializer(read_only=True)
    comment = serializers.CharField(required=False)
    creator = UserSerializer(source="user", read_only=True)
    date_created = serializers.DateTimeField(source="created", read_only=True)
    enabled_states = EnabledStateSerializer(many=True, exclude_fields=["revision_id"])
    recipe = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = RecipeRevision
        fields = [
            "action",
            "approval_request",
            "arguments",
            "bug_number",
            "comment",
            "date_created",
            "enabled_states",
            "enabled",
            "extra_filter_expression",
            "filter_expression",
            "filter_object",
            "id",
            "identicon_seed",
            "name",
            "recipe",
            "creator",
            "updated",
            "experimenter_id",
        ]

    def get_recipe(self, instance):
        serializer = RecipeLinkSerializer(instance.recipe)
        return serializer.data

    def get_action(self, instance):
        serializer = ActionSerializer(
            instance.action, read_only=True, context={"request": self.context.get("request")}
        )
        return serializer.data


class SignatureSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(read_only=True)
    signature = serializers.ReadOnlyField()
    x5u = serializers.ReadOnlyField()
    public_key = serializers.ReadOnlyField()

    class Meta:
        model = Signature
        fields = ["timestamp", "signature", "x5u", "public_key"]


class RecipeSerializer(CustomizableSerializerMixin, serializers.ModelSerializer):
    # read-only fields
    approved_revision = RecipeRevisionSerializer(read_only=True)
    latest_revision = RecipeRevisionSerializer(read_only=True)
    signature = SignatureSerializer(read_only=True)

    # write-only fields
    action_id = serializers.PrimaryKeyRelatedField(
        source="action", queryset=Action.objects.all(), write_only=True
    )
    arguments = serializers.JSONField(write_only=True)
    extra_filter_expression = serializers.CharField(
        required=False, allow_blank=True, write_only=True
    )
    filter_object = serializers.JSONField(required=False, write_only=True)
    name = serializers.CharField(write_only=True)
    identicon_seed = serializers.CharField(required=False, write_only=True)
    comment = serializers.CharField(required=False, write_only=True)
    bug_number = serializers.IntegerField(required=False, write_only=True)
    experimenter_id = serializers.IntegerField(required=False, write_only=True)

    class Meta:
        model = Recipe
        fields = [
            # read-only
            "approved_revision",
            "id",
            "latest_revision",
            "signature",
            # write-only
            "action_id",
            "arguments",
            "extra_filter_expression",
            "filter_object",
            "name",
            "identicon_seed",
            "comment",
            "bug_number",
            "experimenter_id",
        ]

    def get_action(self, instance):
        serializer = ActionSerializer(
            instance.action, read_only=True, context={"request": self.context.get("request")}
        )
        return serializer.data

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if request and request.user:
            validated_data["user"] = request.user

        instance.revise(**validated_data)
        return instance

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user:
            validated_data["user"] = request.user

        if "identicon_seed" not in validated_data:
            validated_data["identicon_seed"] = f"v1:{FuzzyText().fuzz()}"

        recipe = Recipe.objects.create()
        return self.update(recipe, validated_data)

    def validate_extra_filter_expression(self, value):
        if value:
            jexl = JEXL()

            # Add mock transforms for validation. See
            # http://normandy.readthedocs.io/en/latest/user/filter_expressions.html#transforms
            # for a list of what transforms we expect to be available.
            jexl.add_transform("date", lambda x: x)
            jexl.add_transform("stableSample", lambda x: x)
            jexl.add_transform("bucketSample", lambda x: x)
            jexl.add_transform("preferenceValue", lambda x: x)
            jexl.add_transform("preferenceIsUserSet", lambda x: x)
            jexl.add_transform("preferenceExists", lambda x: x)

            errors = list(jexl.validate(value))
            if errors:
                raise serializers.ValidationError(errors)

        return value

    def validate(self, data):
        data = super().validate(data)
        action = data.get("action")
        if action is None:
            action = self.instance.action

        arguments = data.get("arguments")
        if arguments is not None:
            # Ensure the value is a dict
            if not isinstance(arguments, dict):
                raise serializers.ValidationError({"arguments": "Must be an object."})

            # Get the schema associated with the selected action
            schema = action.arguments_schema

            schemaValidator = JSONSchemaValidator(schema)
            errorResponse = {}
            errors = sorted(schemaValidator.iter_errors(arguments), key=lambda e: e.path)

            # Loop through ValidationErrors returned by JSONSchema
            # Each error contains a message and a path attribute
            # message: string human-readable error explanation
            # path: list containing path to offending element
            for error in errors:
                currentLevel = errorResponse

                # Loop through the path of the current error
                # e.g. ['surveys'][0]['weight']
                for index, path in enumerate(error.path):
                    # If this key already exists in our error response, step into it
                    if path in currentLevel:
                        currentLevel = currentLevel[path]
                        continue
                    else:
                        # If we haven't reached the end of the path, add this path
                        # as a key in our error response object and step into it
                        if index < len(error.path) - 1:
                            currentLevel[path] = {}
                            currentLevel = currentLevel[path]
                            continue
                        # If we've reached the final path, set the error message
                        else:
                            currentLevel[path] = error.message

            if errorResponse:
                raise serializers.ValidationError({"arguments": errorResponse})

        if self.instance is None:
            if data.get("extra_filter_expression", "").strip() == "":
                if not data.get("filter_object"):
                    raise serializers.ValidationError(
                        "one of extra_filter_expression or filter_object is required"
                    )
        else:
            if "extra_filter_expression" in data or "filter_object" in data:
                # If either is attempted to be updated, at least one of them must be truthy.
                if not data.get("extra_filter_expression", "").strip() and not data.get(
                    "filter_object"
                ):
                    raise serializers.ValidationError(
                        "if extra_filter_expression is blank, "
                        "at least one filter_object is required"
                    )

        return data

    def validate_filter_object(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError(
                {"non field errors": ["filter_object must be a list."]}
            )

        errors = {}
        for i, obj in enumerate(value):
            if not isinstance(obj, dict):
                errors[i] = {"non field errors": ["filter_object members must be objects."]}
                continue

            if "type" not in obj:
                errors[i] = {"type": ["This field is required."]}
                break

            Filter = filters.by_type.get(obj["type"])
            if Filter is not None:
                filter = Filter(data=obj)
                if not filter.is_valid():
                    errors[i] = filter.errors
            else:
                errors[i] = {"type": [f'Unknown filter object type "{obj["type"]}".']}

        if errors:
            raise serializers.ValidationError(errors)

        return value


class RecipeLinkSerializer(RecipeSerializer):
    class Meta(RecipeSerializer.Meta):
        fields = ["approved_revision_id", "id", "latest_revision_id"]
