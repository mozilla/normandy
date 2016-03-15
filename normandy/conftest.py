from django.core.cache import caches
from django.conf import settings

import pytest
from rest_framework.test import APIClient

from normandy.base.tests import UserFactory


@pytest.fixture
def api_client():
    """Fixture to provide a DRF API client."""
    user = UserFactory(is_superuser=True)
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.yield_fixture()
def django_cache(request):
    """Require a django test cache"""
    for cache_name in settings.CACHES.keys():
        caches[cache_name].clear()

    yield None

    for cache_name in settings.CACHES.keys():
        caches[cache_name].clear()
