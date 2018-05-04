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
def migration(transactional_db):
    """
    This fixture returns a helper object to test Django data migrations.

    The fixture returns an object with two methods;
     - `before` to initialize db to the state before the migration under test
     - `after` to execute the migration and bring db to the state after the migration

    The methods return `old_apps` and `new_apps` respectively; these can
    be used to initiate the ORM models as in the migrations themselves.

    For example:

        def test_foo_set_to_bar(migration):
            old_apps = migration.before('my_app', '0001_inital')
            Foo = old_apps.get_model('my_app', 'foo')
            Foo.objects.create(bar=False)

            assert Foo.objects.count() == 1
            assert Foo.objects.filter(bar=False).count() == Foo.objects.count()

            # executing migration
            new_apps = migration.apply('my_app', '0002_set_foo_bar')
            Foo = new_apps.get_model('my_app', 'foo')
            assert Foo.objects.filter(bar=False).count() == 0
            assert Foo.objects.filter(bar=True).count() == Foo.objects.count()

    Based on: https://gist.github.com/bennylope/82a6088c02fefdd47e18f3c04ec167af
    """
    class Migrator(object):
        def before(self, app, migrate_from):
            """Specify app and starting migration name."""
            self.migrate_from = [(app, migrate_from)]
            self.executor = MigrationExecutor(connection)
            self.executor.migrate(self.migrate_from)
            # prepare state of db to before the migration ("migrate_from" state)
            self._old_apps = self.executor.loader.project_state(self.migrate_from).apps
            return self._old_apps

        def apply(self, app, migrate_to):
            """Migrate forwards to the "migrate_to" migration."""
            self.migrate_to = [(app, migrate_to)]
            self.executor.loader.build_graph()  # reload.
            self.executor.migrate(self.migrate_to)
            self._new_apps = self.executor.loader.project_state(self.migrate_to).apps
            return self._new_apps

    return Migrator()
