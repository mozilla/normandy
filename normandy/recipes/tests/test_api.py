import hashlib
from unittest.mock import patch

from django.db import connection
from django.test.utils import CaptureQueriesContext

import pytest
from rest_framework.reverse import reverse

from normandy.base.api.permissions import AdminEnabledOrReadOnly
from normandy.base.tests import Whatever
from normandy.base.utils import aware_datetime
from normandy.recipes.models import Recipe
from normandy.recipes.tests import (
    ActionFactory,
    RecipeFactory,
)


@pytest.mark.django_db
class TestActionAPI(object):
    def test_it_works(self, api_client):
        res = api_client.get('/api/v1/action/')
        assert res.status_code == 200
        assert res.data == []

    def test_it_serves_actions(self, api_client):
        action = ActionFactory(
            name='foo',
            implementation='foobar',
            arguments_schema={'type': 'object'}
        )

        res = api_client.get('/api/v1/action/')
        action_url = reverse('recipes:action-implementation', kwargs={
            'name': action.name,
            'impl_hash': action.implementation_hash,
        })
        assert res.status_code == 200
        assert res.data == [
            {
                'name': 'foo',
                'implementation_url': Whatever.endswith(action_url),
                'arguments_schema': {'type': 'object'}
            }
        ]

    def test_name_validation(self, api_client):
        """Ensure the name field accepts _any_ valid slug."""
        # Slugs can contain alphanumerics plus _ and -.
        action = ActionFactory(name='foo-bar_baz2')

        res = api_client.get('/api/v1/action/foo-bar_baz2/')
        assert res.status_code == 200
        assert res.data['name'] == action.name

    def test_list_view_includes_cache_headers(self, api_client):
        res = api_client.get('/api/v1/action/')
        assert res.status_code == 200
        # It isn't important to assert a particular value for max-age
        assert 'max-age=' in res['Cache-Control']
        assert 'public' in res['Cache-Control']

    def test_detail_view_includes_cache_headers(self, api_client):
        action = ActionFactory()
        res = api_client.get('/api/v1/action/{name}/'.format(name=action.name))
        assert res.status_code == 200
        # It isn't important to assert a particular value for max-age
        assert 'max-age=' in res['Cache-Control']
        assert 'public' in res['Cache-Control']

    def test_list_sets_no_cookies(self, api_client):
        res = api_client.get('/api/v1/action/')
        assert res.status_code == 200
        assert 'Cookies' not in res

    def test_detail_sets_no_cookies(self, api_client):
        action = ActionFactory()
        res = api_client.get('/api/v1/action/{name}/'.format(name=action.name))
        assert res.status_code == 200
        assert res.client.cookies == {}


@pytest.mark.django_db
class TestImplementationAPI(object):
    def test_it_serves_implementations(self, api_client):
        action = ActionFactory()
        res = api_client.get('/api/v1/action/{name}/implementation/{hash}/'.format(
            name=action.name,
            hash=action.implementation_hash,
        ))
        assert res.status_code == 200
        assert res.content.decode() == action.implementation
        assert res['Content-Type'] == 'application/javascript; charset=utf-8'

    def test_it_404s_if_hash_doesnt_match(self, api_client):
        action = ActionFactory(implementation='asdf')
        bad_hash = hashlib.sha1('nomatch'.encode()).hexdigest()
        res = api_client.get('/api/v1/action/{name}/implementation/{hash}/'.format(
            name=action.name,
            hash=bad_hash,
        ))
        assert res.status_code == 404
        assert res.content.decode() == '/* Hash does not match current stored action. */'
        assert res['Content-Type'] == 'application/javascript; charset=utf-8'

    def test_it_includes_cache_headers(self, api_client, settings):
        # Note: Can't override the cache time setting, since it is read
        # when invoking the decorator at import time. Changing it would
        # require mocking, and that isn't worth it.
        action = ActionFactory()
        res = api_client.get('/api/v1/action/{name}/implementation/{hash}/'.format(
            name=action.name,
            hash=action.implementation_hash,
        ))
        assert res.status_code == 200

        max_age = 'max-age={}'.format(settings.ACTION_IMPLEMENTATION_CACHE_TIME)
        assert max_age in res['Cache-Control']
        assert 'public' in res['Cache-Control']

    def test_sets_no_cookies(self, api_client):
        action = ActionFactory()
        res = api_client.get('/api/v1/action/{name}/implementation/{hash}/'.format(
            name=action.name,
            hash=action.implementation_hash,
        ))
        assert res.status_code == 200
        assert res.client.cookies == {}


@pytest.mark.django_db
class TestRecipeAPI(object):
    def test_it_works(self, api_client):
        res = api_client.get('/api/v1/recipe/')
        assert res.status_code == 200
        assert res.data == []

    def test_it_serves_recipes(self, api_client):
        recipe = RecipeFactory()

        res = api_client.get('/api/v1/recipe/')
        assert res.status_code == 200
        assert res.data[0]['name'] == recipe.name

    def test_it_can_create_recipes(self, api_client):
        action = ActionFactory()

        # Enabled recipe
        res = api_client.post('/api/v1/recipe/', {
            'name': 'Test Recipe',
            'action': action.name,
            'arguments': {},
            'filter_expression': 'whatever',
            'enabled': True
        })
        assert res.status_code == 201

        recipes = Recipe.objects.all()
        assert recipes.count() == 1

    def test_it_can_create_disabled_recipes(self, api_client):
        action = ActionFactory()

        # Disabled recipe
        res = api_client.post('/api/v1/recipe/', {
            'name': 'Test Recipe',
            'action': action.name,
            'arguments': {},
            'filter_expression': 'whatever',
            'enabled': False
        })
        assert res.status_code == 201

        recipes = Recipe.objects.all()
        assert recipes.count() == 1

    def test_it_can_edit_recipes(self, api_client):
        recipe = RecipeFactory(name='unchanged', filter_expression='true')
        old_revision_id = recipe.revision_id

        res = api_client.patch('/api/v1/recipe/%s/' % recipe.id, {
            'name': 'changed',
            'filter_expression': 'false',
        })
        assert res.status_code == 200

        recipe = Recipe.objects.all()[0]
        assert recipe.name == 'changed'
        assert recipe.filter_expression == 'false'
        assert recipe.revision_id != old_revision_id

    def test_creation_when_action_does_not_exist(self, api_client):
        res = api_client.post('/api/v1/recipe/', {'name': 'Test Recipe',
                                                  'action': 'fake-action',
                                                  'arguments': '{}'})
        assert res.status_code == 400

        recipes = Recipe.objects.all()
        assert recipes.count() == 0

    def test_creation_when_arguments_are_invalid(self, api_client):
        ActionFactory(
            name='foobarbaz',
            arguments_schema={
                'type': 'object',
                'properties': {'message': {'type': 'string'}},
                'required': ['message']
            }
        )
        res = api_client.post('/api/v1/recipe/', {'name': 'Test Recipe',
                                                  'enabled': True,
                                                  'filter_expression': 'true',
                                                  'action': 'foobarbaz',
                                                  'arguments': {'message': ''}})
        assert res.status_code == 400

        recipes = Recipe.objects.all()
        assert recipes.count() == 0

    def test_it_can_change_action_for_recipes(self, api_client):
        recipe = RecipeFactory()
        action = ActionFactory()

        res = api_client.patch('/api/v1/recipe/%s/' % recipe.id, {'action': action.name})
        assert res.status_code == 200

        recipe = Recipe.objects.get(pk=recipe.id)
        assert recipe.action == action

    def test_it_can_delete_recipes(self, api_client):
        recipe = RecipeFactory()

        res = api_client.delete('/api/v1/recipe/%s/' % recipe.id)
        assert res.status_code == 204

        recipes = Recipe.objects.all()
        assert recipes.count() == 0

    def test_available_if_admin_enabled(self, api_client, settings):
        settings.ADMIN_ENABLED = True
        res = api_client.get('/api/v1/recipe/')
        assert res.status_code == 200
        assert res.data == []

    def test_readonly_if_admin_disabled(self, api_client, settings):
        settings.ADMIN_ENABLED = False
        res = api_client.get('/api/v1/recipe/')
        assert res.status_code == 200

        recipe = RecipeFactory(name='unchanged')
        res = api_client.patch('/api/v1/recipe/%s/' % recipe.id, {'name': 'changed'})
        assert res.status_code == 403
        assert res.data['detail'] == AdminEnabledOrReadOnly.message

    def test_history(self, api_client):
        recipe = RecipeFactory(name='version 1')
        recipe.update(name='version 2')
        recipe.update(name='version 3')

        res = api_client.get('/api/v1/recipe/%s/history/' % recipe.id)

        assert res.data[0]['recipe']['name'] == 'version 3'
        assert res.data[1]['recipe']['name'] == 'version 2'
        assert res.data[2]['recipe']['name'] == 'version 1'

    def test_it_can_enable_recipes(self, api_client):
        recipe = RecipeFactory(enabled=False)

        res = api_client.post('/api/v1/recipe/%s/enable/' % recipe.id)
        assert res.status_code == 204

        recipe = Recipe.objects.all()[0]
        assert recipe.enabled

    def test_it_can_disable_recipes(self, api_client):
        recipe = RecipeFactory(enabled=True)

        res = api_client.post('/api/v1/recipe/%s/disable/' % recipe.id)
        assert res.status_code == 204

        recipe = Recipe.objects.all()[0]
        assert not recipe.enabled

    def test_filtering_by_enabled_lowercase(self, api_client):
        r1 = RecipeFactory(enabled=True)
        RecipeFactory(enabled=False)

        res = api_client.get('/api/v1/recipe/?enabled=true')
        assert res.status_code == 200
        assert [r['id'] for r in res.data] == [r1.id]

    def test_list_view_includes_cache_headers(self, api_client):
        res = api_client.get('/api/v1/recipe/')
        assert res.status_code == 200
        # It isn't important to assert a particular value for max_age
        assert 'max-age=' in res['Cache-Control']
        assert 'public' in res['Cache-Control']

    def test_detail_view_includes_cache_headers(self, api_client):
        recipe = RecipeFactory()
        res = api_client.get('/api/v1/recipe/{id}/'.format(id=recipe.id))
        assert res.status_code == 200
        # It isn't important to assert a particular value for max-age
        assert 'max-age=' in res['Cache-Control']
        assert 'public' in res['Cache-Control']

    def test_signed_listing_works(self, api_client):
        r1 = RecipeFactory(signed=True)
        res = api_client.get('/api/v1/recipe/signed/')
        assert res.status_code == 200
        assert len(res.data) == 1
        assert res.data[0]['recipe']['id'] == r1.id
        assert res.data[0]['signature']['signature'] == r1.signature.signature

    def test_signed_only_lists_signed_recipes(self, api_client):
        r1 = RecipeFactory(signed=True)
        r2 = RecipeFactory(signed=True)
        RecipeFactory(signed=False)
        res = api_client.get('/api/v1/recipe/signed/')
        assert res.status_code == 200
        assert len(res.data) == 2

        res.data.sort(key=lambda r: r['recipe']['id'])

        assert res.data[0]['recipe']['id'] == r1.id
        assert res.data[0]['signature']['signature'] == r1.signature.signature
        assert res.data[1]['recipe']['id'] == r2.id
        assert res.data[1]['signature']['signature'] == r2.signature.signature

    def test_list_sets_no_cookies(self, api_client):
        res = api_client.get('/api/v1/recipe/')
        assert res.status_code == 200
        assert 'Cookies' not in res

    def test_detail_sets_no_cookies(self, api_client):
        recipe = RecipeFactory()
        res = api_client.get('/api/v1/recipe/{id}/'.format(id=recipe.id))
        assert res.status_code == 200
        assert res.client.cookies == {}


@pytest.mark.django_db
class TestRecipeRevisionAPI(object):
    def test_it_works(self, api_client):
        res = api_client.get('/api/v1/recipe_revision/')
        assert res.status_code == 200
        assert res.data == []

    def test_it_serves_revisions(self, api_client):
        recipe = RecipeFactory()
        res = api_client.get('/api/v1/recipe_revision/%s/' % recipe.latest_revision.id)
        assert res.status_code == 200
        assert res.data['id'] == recipe.latest_revision.id


@pytest.mark.django_db
class TestClassifyClient(object):
    def test_it_works(self, api_client):
        get_country_code_patch = patch('normandy.recipes.models.get_country_code')
        timezone_patch = patch('normandy.base.middleware.timezone')

        with get_country_code_patch as get_country_code, timezone_patch as timezone:
            get_country_code.return_value = 'us'
            timezone.now.return_value = aware_datetime(2016, 1, 1)
            res = api_client.get('/api/v1/classify_client/')

        assert res.status_code == 200
        assert res.data == {
            'country': 'us',
            'request_time': '2016-01-01T00:00:00Z',
        }

    def test_makes_no_db_queries(self, client):
        queries = CaptureQueriesContext(connection)
        with queries:
            res = client.get('/api/v1/classify_client/')
            assert res.status_code == 200
        assert len(queries) == 0

    def test_sets_no_cookies(self, api_client):
        res = api_client.get('/api/v1/classify_client/')
        assert res.status_code == 200
        assert res.client.cookies == {}
