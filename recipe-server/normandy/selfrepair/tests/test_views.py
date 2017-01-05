from django.core.urlresolvers import reverse
from django.db import connection
from django.test.utils import CaptureQueriesContext

import pytest


class TestSelfRepair:
    def test_url_is_right(self):
        url = reverse('selfrepair:index', args=['en-US'])
        assert url == '/en-US/repair'

    @pytest.mark.django_db
    def test_makes_no_db_queries(self, client):
        queries = CaptureQueriesContext(connection)
        with queries:
            url = reverse('selfrepair:index', args=['en-US'])
            res = client.get(url)
            assert res.status_code == 200
        assert len(queries) == 0

    @pytest.mark.django_db
    def test_doesnt_redirect(self, client):
        url = '/en-US/repair'
        assert client.get(url).status_code == 200
        url += '/'
        assert client.get(url).status_code == 200

    def test_sets_no_cookies(self, client):
        res = client.get('/en-US/repair')
        assert res.status_code == 200
        assert res.client.cookies == {}
