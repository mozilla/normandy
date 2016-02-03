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
