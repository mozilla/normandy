import pytest

from normandy.base.tests import Whatever
from normandy.studies.tests import ExtensionFactory


@pytest.mark.django_db
class TestExtensionAPI(object):
    def test_it_works(self, api_client):
        res = api_client.get('/api/v2/extension/')
        assert res.status_code == 200
        assert res.data['results'] == []

    def test_it_serves_extensions(self, api_client):
        extension = ExtensionFactory(
            name='foo',
        )

        res = api_client.get('/api/v2/extension/')
        assert res.status_code == 200
        assert res.data['results'] == [
            {
                'id': extension.id,
                'name': 'foo',
                'xpi': Whatever(),
            }
        ]

    def test_list_view_includes_cache_headers(self, api_client):
        res = api_client.get('/api/v2/extension/')
        assert res.status_code == 200
        # It isn't important to assert a particular value for max-age
        assert 'max-age=' in res['Cache-Control']
        assert 'public' in res['Cache-Control']

    def test_detail_view_includes_cache_headers(self, api_client):
        extension = ExtensionFactory()
        res = api_client.get('/api/v2/extension/{id}/'.format(id=extension.id))
        assert res.status_code == 200
        # It isn't important to assert a particular value for max-age
        assert 'max-age=' in res['Cache-Control']
        assert 'public' in res['Cache-Control']

    def test_list_sets_no_cookies(self, api_client):
        res = api_client.get('/api/v2/extension/')
        assert res.status_code == 200
        assert 'Cookies' not in res

    def test_detail_sets_no_cookies(self, api_client):
        extension = ExtensionFactory()
        res = api_client.get('/api/v2/extension/{id}/'.format(id=extension.id))
        assert res.status_code == 200
        assert res.client.cookies == {}