import json
import jsonschema

from django.core.exceptions import ValidationError


# Add path to required validator so we can get property name
def _required(validator, requirements, instance, schema):
    """Validate 'required' properties."""
    if not validator.is_type(instance, 'object'):
        return

    for index, requirement in enumerate(requirements):
        if instance.get(requirement, '') == '':
            error = jsonschema.ValidationError(
                'This field may not be blank.',
                path=[requirement]
            )
            yield error


# Construct validator as extension of Json Schema Draft 4.
JSONSchemaValidator = jsonschema.validators.extend(
    validator=jsonschema.validators.Draft4Validator,
    validators={
        'required': _required
    }
)


def validate_json(value):
    """
    Validate that a given value can be successfully parsed as JSON.
    """
    try:
        json.loads(value)
    except json.JSONDecodeError as err:
        raise ValidationError('%s is not valid JSON: %s', params=(value, err.msg))
