import hashlib

import pytest
from rest_framework.test import APIClient

from normandy.base.tests import UserFactory, skip_except_in_ci
from normandy.base.utils import canonical_json_dumps
from normandy.recipes import geolocation as geolocation_module


@pytest.fixture
def api_client():
    """Fixture to provide a DRF API client."""
    user = UserFactory(is_superuser=True)
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def geolocation():
    """Fixture to load geolocation data."""
    geolocation_module.load_geoip_database()
    if geolocation_module.geoip_reader is None:
        skip_except_in_ci()
    else:
        return geolocation_module


@pytest.fixture
def mocked_autograph(mocker):
    mocked = mocker.patch('normandy.recipes.models.Autographer')

    def fake_sign(datas):
        sigs = []
        for d in datas:
            sigs.append({
                'signature': hashlib.sha256(d).hexdigest()
            })
        return sigs

    mocked.return_value.sign_data.side_effect = fake_sign

    def verify_api_pair(recipe_and_signature):
        recipe = recipe_and_signature['recipe']
        expected_signature = recipe_and_signature['signature']['signature']
        data = canonical_json_dumps(recipe).encode()
        actual_signature = fake_sign([data])[0]['signature']
        assert actual_signature == expected_signature

    mocked.verify_api_pair = verify_api_pair

    return mocked
