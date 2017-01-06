from django.core.checks import Info, Warning, Error, register as register_check
from django.core.exceptions import ImproperlyConfigured
from django.db import connection
from django.db.utils import OperationalError, ProgrammingError


INFO_CANT_CHECK_MIGRATIONS = 'normandy.health.I001'
WARNING_UNAPPLIED_MIGRATION = 'normandy.health.W001'
ERROR_CANNOT_CONNECT_DATABASE = 'normandy.health.E001'
ERROR_UNUSABLE_DATABASE = 'normandy.health.E002'
ERROR_MISCONFIGURED_DATABASE = 'normandy.health.E003'


def database_connected(app_configs, **kwargs):
    errors = []

    try:
        connection.ensure_connection()
    except OperationalError as e:
        msg = 'Could not connect to database: {!s}'.format(e)
        errors.append(Error(msg, id=ERROR_CANNOT_CONNECT_DATABASE))
    except ImproperlyConfigured as e:
        msg = 'Datbase misconfigured: "{!s}"'.format(e)
        errors.append(Error(msg, id=ERROR_MISCONFIGURED_DATABASE))
    else:
        if not connection.is_usable():
            errors.append(Error('Database connection is not usable', id=ERROR_UNUSABLE_DATABASE))

    return errors


def migrations_applied(app_configs, **kwargs):
    from django.db.migrations.loader import MigrationLoader
    errors = []

    # Load migrations from disk/DB
    try:
        loader = MigrationLoader(connection, ignore_no_migrations=True)
    except (ImproperlyConfigured, ProgrammingError, OperationalError):
        msg = "Can't connect to database to check migrations"
        return [Info(msg, id=INFO_CANT_CHECK_MIGRATIONS)]
    graph = loader.graph

    if app_configs:
        app_labels = [app.label for app in app_configs]
    else:
        app_labels = loader.migrated_apps

    for node, migration in graph.nodes.items():
        if migration.app_label not in app_labels:
            continue
        if node not in loader.applied_migrations:
            msg = 'Unapplied migration {}'.format(migration)
            # NB: This *must* be a Warning, not an Error, because Errors
            # prevent migrations from being run.
            errors.append(Warning(msg, id=WARNING_UNAPPLIED_MIGRATION))

    return errors


def register():
    register_check(database_connected)
    register_check(migrations_applied)
