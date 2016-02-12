import json

from django.core.exceptions import ValidationError


def validate_json(value):
    """
    Validate that a given value can be successfully parsed as JSON.
    """
    try:
        json.loads(value)
    except json.JSONDecodeError as err:
        raise ValidationError('%s is not valid JSON: %s', params=(value, err.msg))
