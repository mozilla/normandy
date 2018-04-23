from django.core.exceptions import ValidationError

import pytest

from normandy.recipes.validators import validate_json


def test_validate_json():
    validate_json('{}')
    validate_json('{"foo": 2, "bar": "bazz"}')
    with pytest.raises(ValidationError):
        validate_json('invalid_json"""""sadf')
