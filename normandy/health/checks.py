from django.core.checks import Error, register as register_check
from django.db import connection
from django.db.utils import OperationalError


def database_connected(app_configs, **kwargs):
    errors = []

    try:
        connection.ensure_connection()
    except OperationalError:
        errors.append(Error('Could not connect to database', id='normandy.E001'))
    else:
        if not connection.is_usable():
            errors.append(Error('Database connection is not usable', id='normandy.E002'))

    return errors


def register():
    register_check(database_connected)
