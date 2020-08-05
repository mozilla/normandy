import json
import jsonschema

from django.core.exceptions import ValidationError


# Add path to the required validator so we can add a `path` field pointing to the field that is required.
def _required(validator, requirements, instance, schema):
    """Validate 'required' properties."""
    if not validator.is_type(instance, "object"):
        return

    for index, requirement in enumerate(requirements):
        if instance.get(requirement) is None:
            error = jsonschema.ValidationError("This field is required.", path=[requirement])
            yield error


# Construct validator as extension of Json Schema Draft 4.
JSONSchemaValidator = jsonschema.validators.extend(
    validator=jsonschema.validators.Draft4Validator, validators={"required": _required}
)


def validate_json(value):
    """
    Validate that a given value can be successfully parsed as JSON.
    """
    try:
        json.loads(value)
    except json.JSONDecodeError as err:
        raise ValidationError("%s is not valid JSON: %s", params=(value, err.msg))
