from datetime import datetime, timedelta
from io import StringIO
from django.core.management import call_command

import pytest
from unittest.mock import patch

from normandy.recipes.tests import ActionFactory


@pytest.mark.django_db
class TestUpdateActionSignatures:
    def test_end_to_end(self, settings):
        settings.ACTION_SIGNATURE_MAX_AGE = 60 * 60 * 24 * 7  # one week
        out = StringIO()
        # One action without a signature
        a1 = ActionFactory(name='no sig')
        # One action with a too-old signature
        two_weeks_ago = datetime.now() - timedelta(days=14)
        a2 = ActionFactory(name='old sig', signature='fake', signature_timestamp=two_weeks_ago)
        # One action that doesn't need updated
        a3 = ActionFactory(name='up to date', signature='fake', signature_timestamp=datetime.now())

        with patch('normandy.recipes.models.Autographer'):
            call_command('update_action_signatures', stdout=out)

        out = out.getvalue()
        assert 'Updating signatures for 2 actions' in out
        assert a1.name in out
        assert a2.name in out
        assert a3.name not in out

    def test_with_no_actions(self):
        out = StringIO()

        with patch('normandy.recipes.models.Autographer'):
            call_command('update_action_signatures', stdout=out)

        out = out.getvalue()
        assert out == 'No out of date actions\n'
