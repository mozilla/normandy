import json

import pytest

from django.conf.urls import url
from django.views.generic import View

from normandy.base.api.views import APIRootView


@pytest.mark.django_db
class TestApiRoot(object):
    def test_it_works(self, api_client):
        res = api_client.get('/api/v1/')
        assert res.status_code == 200
        assert res.json() == {
            'recipe-list': 'http://testserver/api/v1/recipe/',
            'recipe-signed': 'http://testserver/api/v1/recipe/signed/',
            'action-list': 'http://testserver/api/v1/action/',
            'reciperevision-list': 'http://testserver/api/v1/recipe_revision/',
            'classify-client': 'http://testserver/api/v1/classify_client/',
        }

    def test_it_redirects_classify_client_to_app_server(self, api_client, settings):
        settings.APP_SERVER_URL = 'https://testserver-app/'

        res = api_client.get('/api/v1/')
        assert res.status_code == 200
        assert res.json()['classify-client'] == 'https://testserver-app/api/v1/classify_client/'


class TestAPIRootView(object):

    class NormalView(View):
        pass

    class DynamicOnlyView(View):
        always_dynamic = True

    def test_it_works(self, rf, mocker):
        mock_reverse = mocker.patch('normandy.base.api.views.reverse')
        mock_reverse.return_value = '/test'
        urls = [url('^test/?$', self.NormalView.as_view(), name='test-view')]
        view = APIRootView.as_view(api_urls=urls)

        res = view(rf.get('/test'))
        assert mock_reverse.called
        assert res.status_code == 200
        res.render()
        assert json.loads(res.content.decode()) == {
            'test-view': 'http://testserver/test',
        }

    def test_it_reroutes_dynamic_views(self, rf, mocker, settings):
        mock_reverse = mocker.patch('normandy.base.api.views.reverse')
        mock_reverse.return_value = '/test'
        settings.APP_SERVER_URL = 'https://testserver-app/'
        urls = [url('^test/?$', self.DynamicOnlyView.as_view(), name='test-view')]
        view = APIRootView.as_view(api_urls=urls)

        res = view(rf.get('/test'))
        assert mock_reverse.called
        assert res.status_code == 200
        res.render()
        assert json.loads(res.content.decode()) == {
            'test-view': 'https://testserver-app/test',
        }

    def test_it_doesnt_break_with_dynamic_views_and_no_setting(self, rf, mocker, settings):
        mock_reverse = mocker.patch('normandy.base.api.views.reverse')
        mock_reverse.return_value = '/test'
        settings.APP_SERVER_URL = None
        urls = [url('^test/?$', self.DynamicOnlyView.as_view(), name='test-view')]
        view = APIRootView.as_view(api_urls=urls)

        res = view(rf.get('/test'))
        assert mock_reverse.called
        assert res.status_code == 200
        res.render()
        assert json.loads(res.content.decode()) == {
            'test-view': 'http://testserver/test',
        }
