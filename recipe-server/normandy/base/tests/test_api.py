import json

import pytest

from django.conf.urls import url
from django.contrib.auth.models import User
from django.views.generic import View

from normandy.base.api.views import APIRootView
from normandy.base.api.routers import MixedViewRouter
from normandy.base.tests import Whatever


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
            'approvalrequest-list': 'http://testserver/api/v1/approval_request/',
            'filters': 'http://testserver/api/v1/filters/',
        }

    def test_it_redirects_classify_client_to_app_server(self, api_client, settings):
        settings.APP_SERVER_URL = 'https://testserver-app/'

        res = api_client.get('/api/v1/')
        assert res.status_code == 200
        assert res.json()['classify-client'] == 'https://testserver-app/api/v1/classify_client/'


class TestAPIRootView(object):

    @pytest.fixture
    def static_url_pattern(cls):
        return url('^test$', View.as_view(), name='test-view')

    @pytest.fixture
    def dynamic_url_pattern(cls):
        url_pattern = url('^test$', View.as_view(), name='test-view')
        url_pattern.allow_cdn = False
        return url_pattern

    def test_it_works(self, rf, mocker, static_url_pattern):
        mock_reverse = mocker.patch('normandy.base.api.views.reverse')
        mock_reverse.return_value = '/test'
        view = APIRootView.as_view(api_urls=[static_url_pattern])

        res = view(rf.get('/test'))
        assert mock_reverse.called
        assert res.status_code == 200
        res.render()
        assert json.loads(res.content.decode()) == {
            'test-view': 'http://testserver/test',
        }

    def test_it_reroutes_dynamic_views(self, rf, mocker, settings, dynamic_url_pattern):
        mock_reverse = mocker.patch('normandy.base.api.views.reverse')
        mock_reverse.return_value = '/test'
        settings.APP_SERVER_URL = 'https://testserver-app/'
        view = APIRootView.as_view(api_urls=[dynamic_url_pattern])

        res = view(rf.get('/test'))
        assert mock_reverse.called
        assert res.status_code == 200
        res.render()
        assert json.loads(res.content.decode()) == {
            'test-view': 'https://testserver-app/test',
        }

    def test_dynamic_views_and_no_setting(self, rf, mocker, settings, dynamic_url_pattern):
        mock_reverse = mocker.patch('normandy.base.api.views.reverse')
        mock_reverse.return_value = '/test'
        settings.APP_SERVER_URL = None
        view = APIRootView.as_view(api_urls=[dynamic_url_pattern])

        res = view(rf.get('/test'))
        assert mock_reverse.called
        assert res.status_code == 200
        res.render()
        assert json.loads(res.content.decode()) == {
            'test-view': 'http://testserver/test',
        }


class TestMixedViewRouter(object):

    def test_register_view_takes_allow_cdn(self):
        router = MixedViewRouter()
        router.register_view('view-1', View, name='view-1', allow_cdn=True)
        router.register_view('view-2', View, name='view-2', allow_cdn=False)
        assert [v.name for v in router.registered_view_urls] == ['view-1', 'view-2']
        assert router.registered_view_urls[0].allow_cdn
        assert not router.registered_view_urls[1].allow_cdn

    def test_register_view_requires_name(self):
        router = MixedViewRouter()
        with pytest.raises(TypeError) as err:
            router.register_view('view', View, allow_cdn=True)
        assert "missing 1 required keyword-only argument: 'name'" in str(err)

    def test_get_urls_includes_api_root(self):
        router = MixedViewRouter()
        urls = router.get_urls()
        assert len(urls) == 1
        assert urls[0].name == router.root_view_name

    def test_get_urls_includes_non_viewset_views(self):
        router = MixedViewRouter()
        router.register_view('view', View, name='standalone-view')
        urls = router.get_urls()
        assert len(urls) == 2
        assert urls[0].name == 'standalone-view'

    def test_it_doesnt_pass_the_api_root_url_to_the_api_root_view(self, mocker):
        mock_api_view = mocker.Mock()
        router = MixedViewRouter(view=mock_api_view)
        router.register_view('view', View, name='standalone-view')
        router.get_urls()
        assert mock_api_view.called_once_with([Whatever(lambda v: v.name == 'standalone-view')])


@pytest.mark.django_db
class TestCurrentUserView(object):
    def test_it_works(self, api_client):
        res = api_client.get('/api/v1/user/me/')
        user = User.objects.first()  # Get the default user
        assert res.status_code == 200
        assert res.data == {
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email
        }

    def test_unauthorized(self, api_client):
        res = api_client.logout()
        res = api_client.get('/api/v1/user/me/')
        assert res.status_code == 401