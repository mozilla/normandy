from django.core.checks import Error, register as register_check
from django.db import connection
from django.db.utils import OperationalError


ERROR_CANNOT_CONNECT_DATABASE = 'normandy.health.E001'
ERROR_UNUSABLE_DATABASE = 'normandy.health.E002'


def database_connected(app_configs, **kwargs):
    errors = []

    try:
        connection.ensure_connection()
    except OperationalError:
        errors.append(Error('Could not connect to database', id=ERROR_CANNOT_CONNECT_DATABASE))
    else:
        if not connection.is_usable():
            errors.append(Error('Database connection is not usable', id=ERROR_UNUSABLE_DATABASE))

    return errors


def register():
    register_check(database_connected)
