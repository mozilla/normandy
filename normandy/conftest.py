from django.core.cache import caches
from django.conf import settings

import pytest
from rest_framework.test import APIClient

from normandy.base.tests import UserFactory, skip_except_in_ci
from normandy.base.api import mixins
from normandy.recipes import geolocation as geolocation_module


@pytest.fixture
def api_client():
    """Fixture to provide a DRF API client."""
    user = UserFactory(is_superuser=True)
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.yield_fixture(autouse=True)
def django_cache(request):
    """Require a django test cache"""
    yield None
    for cache_name in settings.CACHES.keys():
        caches[cache_name].clear()


@pytest.fixture
def geolocation():
    """Fixture to load geolocation data."""
    geolocation_module.load_geoip_database()
    if geolocation_module.geoip_reader is None:
        skip_except_in_ci()
    else:
        return geolocation_module


@pytest.yield_fixture()
def skip_midair():
    """Fixture to skip mid-air collision checks"""
    try:
        mixins._set_midair_collision(False)
        yield None
    finally:
        mixins._set_midair_collision(True)
