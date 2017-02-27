from urllib.parse import urljoin

from django.core.urlresolvers import reverse
from django.db import connection
from django.test.utils import CaptureQueriesContext

import pytest


class TestSelfRepair:
    url = '/en-US/repair'

    def test_url_is_right(self):
        url = reverse('selfrepair:index', args=['en-US'])
        assert url == self.url

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
        assert client.get(self.url).status_code == 200
        assert client.get(self.url + '/').status_code == 200

    def test_sets_no_cookies(self, client):
        res = client.get(self.url)
        assert res.status_code == 200
        assert res.client.cookies == {}

    def test_classify_url_is_right_no_app_server(self, client, settings):
        settings.APP_SERVER_URL = None
        classify_client_url = reverse('recipes:classify-client')
        res = client.get(self.url)
        assert res.status_code == 200
        expected = 'data-classify-url="{}"'.format(classify_client_url)
        assert expected in res.content.decode()

    def test_classify_url_is_right_with_app_server(self, client, settings):
        settings.APP_SERVER_URL = 'https://testserver-cdn/'
        classify_client_url = urljoin(settings.APP_SERVER_URL, reverse('recipes:classify-client'))
        res = client.get(self.url)
        assert res.status_code == 200
        expected = 'data-classify-url="{}"'.format(classify_client_url)
        assert expected in res.content.decode()
