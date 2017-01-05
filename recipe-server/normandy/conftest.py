import hashlib

import pytest
from rest_framework.test import APIClient

from normandy.base.tests import UserFactory, skip_except_in_ci
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
    return mocked
