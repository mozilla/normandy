from django.db import connection
from django.test.utils import CaptureQueriesContext

import pytest


def test_version(client, mocker):
    get_version_info = mocker.patch('normandy.health.api.views.get_version_info')
    get_version_info.return_value = ('<git hash>', '<tag>')

    res = client.get('/__version__')
    assert res.status_code == 200
    assert res.data == {
        'source': 'https://github.com/mozilla/normandy',
        'commit': '<git hash>',
        'commit_link': 'https://github.com/mozilla/normandy/commit/<git hash>',
        'configuration': 'Test',
        'version': '<tag>',
    }


@pytest.mark.django_db
def test_lbheartbeat_makes_no_db_queries(client):
    queries = CaptureQueriesContext(connection)
    with queries:
        res = client.get('/__lbheartbeat__')
        assert res.status_code == 200
    assert len(queries) == 0
