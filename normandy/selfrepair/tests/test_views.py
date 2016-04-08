from django.core.urlresolvers import reverse
from django.db import connection
from django.test.utils import CaptureQueriesContext

import pytest


@pytest.mark.django_db
def test_selfrepair_makes_no_db_queries(client):
    queries = CaptureQueriesContext(connection)
    with queries:
        url = reverse('selfrepair:index', args={'locale': 'en-US'})
        res = client.get(url)
        assert res.status_code == 200
    assert len(queries) == 0
