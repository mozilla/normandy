from django.core.management import call_command
from django.db import connection
from django.db.migrations.executor import MigrationExecutor

import pytest
import requests_mock
from graphene.test import Client as GrapheneClient
from rest_framework.test import APIClient

from normandy.schema import schema as normandy_schema
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
def gql_client():
    """Fixture to provide a Graphene client."""
    client = GrapheneClient(normandy_schema)
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
    mocked = mocker.patch("normandy.recipes.models.Autographer")
    mocked.return_value.sign_data.side_effect = fake_sign
    return mocked


@pytest.fixture
def mocked_remotesettings(mocker):
    return mocker.patch("normandy.recipes.models.RemoteSettings")


@pytest.fixture
def rs_settings(settings):
    settings.REMOTE_SETTINGS_URL = "https://remotesettings.example.com/v1"
    settings.REMOTE_SETTINGS_USERNAME = "normandy"
    settings.REMOTE_SETTINGS_PASSWORD = "n0rm4ndy"
    return settings


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

        def reset(self):
            call_command("migrate", no_input=True)

    return Migrator()


@pytest.fixture
def requestsmock():
    """Return a context where requests are all mocked.
    Usage::

        def test_something(requestsmock):
            requestsmock.get(
                'https://example.com/path'
                content=b'The content'
            )
            # Do stuff that involves requests.get('http://example.com/path')
    """
    with requests_mock.mock() as m:
        yield m


@pytest.fixture
def storage(settings):
    settings.DEFAULT_FILE_STORAGE = "normandy.base.storage.NormandyInMemoryStorage"

    from django.core.files.storage import default_storage

    yield default_storage

    dirs_to_delete = ["/"]
    while len(dirs_to_delete) > 0:
        dir_path = dirs_to_delete.pop()
        paths, new_dirs = default_storage.listdir(dir_path)
        dirs_to_delete.extend(new_dirs)
        for path in paths:
            default_storage.delete(path)
