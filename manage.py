#!/usr/bin/env python
import os
import sys
import warnings


warnings.filterwarnings(
    "ignore",
    message="The psycopg2 wheel package will be renamed from release 2.8; in order to keep "
    'installing from binary please use "pip install psycopg2-binary" instead. '
    "For details see: <http://initd.org/psycopg/docs/install.html#binary-install-from-pypi>.",
)


if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "normandy.settings")
    os.environ.setdefault("DJANGO_CONFIGURATION", "Development")

    from configurations.management import execute_from_command_line

    execute_from_command_line(sys.argv)
