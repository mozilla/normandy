import pytest
from rest_framework.test import APIClient

from django.db import connection
from django.db.migrations.executor import MigrationExecutor

from normandy.base.tests import UserFactory, skip_except_in_ci
from normandy.recipes import geolocation as geolocation_module
from normandy.recipes.tests import fake_sign


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
    mocked.return_value.sign_data.side_effect = fake_sign
    return mocked


@pytest.fixture()
def migrations(transactional_db):
    """
    This fixture returns a helper object to test Django data migrations.
    Based on: https://gist.github.com/bennylope/82a6088c02fefdd47e18f3c04ec167af
    """
    class Migrator(object):
        def migrate(self, app, to):
            migration = [(app, to)]
            executor = MigrationExecutor(connection)
            executor.migrate(migration)
            return executor.loader.project_state(migration).apps

    return Migrator()
