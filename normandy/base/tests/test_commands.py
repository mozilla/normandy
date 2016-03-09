from django.core.management import call_command

import pytest


@pytest.mark.django_db
def test_initial_data():
    """Verify that the initial_data command doesn't throw an error."""
    call_command('initial_data')
