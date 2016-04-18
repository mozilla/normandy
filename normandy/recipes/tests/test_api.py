import hashlib
from unittest.mock import patch

import pytest
from rest_framework.reverse import reverse
from reversion import revisions as reversion

from django.db import connection
from django.test.utils import CaptureQueriesContext

from normandy.base.api.permissions import AdminEnabled
from normandy.base.tests import Whatever
from normandy.recipes.models import Action, Recipe
from normandy.recipes.api.permissions import NotInUse
from normandy.recipes.tests import (
    ActionFactory,
    ClientParametersFactory,
    LocaleFactory,
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

    def test_it_can_create_actions(self, api_client):
        res = api_client.post('/api/v1/action/', {
            'name': 'foo',
            'implementation': 'foobar',
            'arguments_schema': {'type': 'object'},
        })
        assert res.status_code == 201

        action = Action.objects.all()[0]
        assert action.name == 'foo'
        assert action.implementation == 'foobar'
        assert action.arguments_schema == {'type': 'object'}

    def test_it_can_edit_actions(self, api_client):
        ActionFactory(name='foo', implementation='original')

        res = api_client.patch('/api/v1/action/foo/', {'implementation': 'changed'})
        assert res.status_code == 200

        action = Action.objects.all()[0]
        assert action.name == 'foo'
        assert action.implementation == 'changed'

    def test_put_creates_and_edits(self, api_client):
        """
        PUT requests should create objects, or edit them if they already
        exist.
        """
        res = api_client.put('/api/v1/action/foo/', {
            'name': 'foo',
            'implementation': 'original',
            'arguments_schema': {}
        })
        assert res.status_code == 201

        action = Action.objects.all()[0]
        assert action.implementation == 'original'

        res = api_client.put('/api/v1/action/foo/', {
            'name': 'foo',
            'implementation': 'changed',
            'arguments_schema': {}
        })
        assert res.status_code == 200

        action.refresh_from_db()
        assert action.implementation == 'changed'

    def test_it_can_delete_actions(self, api_client):
        ActionFactory(name='foo', implementation='foobar')
        assert Action.objects.exists()

        res = api_client.delete('/api/v1/action/foo/')
        assert res.status_code == 204
        assert not Action.objects.exists()

    def test_name_validation(self, api_client):
        """Ensure the name field accepts _any_ valid slug."""
        # Slugs can contain alphanumerics plus _ and -.
        res = api_client.post('/api/v1/action/', {
            'name': 'foo-bar_baz2',
            'implementation': 'foobar',
            'arguments_schema': {'type': 'object'},
        })
        assert res.status_code == 201

        action = Action.objects.all()[0]
        assert action.name == 'foo-bar_baz2'
        assert action.implementation == 'foobar'
        assert action.arguments_schema == {'type': 'object'}

    def test_it_cant_edit_actions_in_use(self, api_client, settings):
        RecipeFactory(action__name='active', enabled=True)
        settings.CAN_EDIT_ACTIONS_IN_USE = False

        res = api_client.patch('/api/v1/action/active/', {'implementation': 'foobar'})
        assert res.status_code == 403
        assert res.data['detail'] == NotInUse.message

        res = api_client.delete('/api/v1/action/active/')
        assert res.status_code == 403
        assert res.data['detail'] == NotInUse.message

    def test_it_can_edit_actions_in_use_with_setting(self, api_client, settings):
        RecipeFactory(action__name='active', enabled=True)
        settings.CAN_EDIT_ACTIONS_IN_USE = True

        res = api_client.patch('/api/v1/action/active/', {'implementation': 'foobar'})
        assert res.status_code == 200

        res = api_client.delete('/api/v1/action/active/')
        assert res.status_code == 204

    def test_available_if_admin_enabled(self, api_client, settings):
        settings.ADMIN_ENABLED = True
        res = api_client.get('/api/v1/action/')
        assert res.status_code == 200
        assert res.data == []

    def test_unavailable_if_admin_disabled(self, api_client, settings):
        settings.ADMIN_ENABLED = False
        res = api_client.get('/api/v1/action/')
        assert res.status_code == 403
        assert res.data['detail'] == AdminEnabled.message

    def test_it_creates_revisions_on_create(self, api_client):
        res = api_client.post('/api/v1/action/', {
            'name': 'foo',
            'implementation': 'foobar',
            'arguments_schema': {'type': 'object'},
        })
        assert res.status_code == 201

        action = Action.objects.all()[0]
        assert len(reversion.get_for_object(action)) == 1

    def test_it_creates_revisions_on_update(self, api_client):
        ActionFactory(name='foo', implementation='original')

        res = api_client.patch('/api/v1/action/foo/', {'implementation': 'changed'})
        assert res.status_code == 200

        action = Action.objects.all()[0]
        assert len(reversion.get_for_object(action)) == 1


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

    def test_it_can_edit_recipes(self, api_client):
        recipe = RecipeFactory(name='unchanged')
        old_revision_id = recipe.revision_id

        res = api_client.patch('/api/v1/recipe/%s/' % recipe.id, {'name': 'changed'})
        assert res.status_code == 200

        recipe = Recipe.objects.all()[0]
        assert recipe.name == 'changed'
        assert recipe.revision_id == old_revision_id + 1

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

    def test_unavailable_if_admin_disabled(self, api_client, settings):
        settings.ADMIN_ENABLED = False
        res = api_client.get('/api/v1/recipe/')
        assert res.status_code == 403
        assert res.data['detail'] == AdminEnabled.message


@pytest.mark.django_db
class TestFetchBundleAPI(object):

    def test_it_works(self, client):
        data = ClientParametersFactory()
        res = client.post('/api/v1/fetch_bundle/', data)
        assert res.status_code == 200
        assert res.data == {'recipes': [], 'country': None}

    def test_it_serves_recipes(self, client):
        recipe = RecipeFactory(arguments={'foo': 'bar'})
        data = ClientParametersFactory()
        res = client.post('/api/v1/fetch_bundle/', data)

        action = recipe.action
        impl_url = reverse('recipes:action-implementation', kwargs={
            'name': action.name,
            'impl_hash': action.implementation_hash,
        })
        assert res.status_code == 200
        assert res.data['recipes'] == [{
            'name': recipe.name,
            'id': recipe.id,
            'revision_id': recipe.revision_id,
            'action': {
                'name': action.name,
                'implementation_url': Whatever.endswith(impl_url),
                'arguments_schema': action.arguments_schema,
            },
            'arguments': {
                'foo': 'bar',
            },
        }]

    def test_it_filters_by_locale(self, client):
        english = LocaleFactory(code='en-US')
        german = LocaleFactory(code='de')

        RecipeFactory(name='english', enabled=True, locales=[english])
        RecipeFactory(name='german', enabled=True, locales=[german])
        RecipeFactory(name='any', enabled=True, locales=[])
        RecipeFactory(name='both', enabled=True, locales=[english, german])
        RecipeFactory(name='disabled', enabled=False, locales=[german])

        data = ClientParametersFactory(locale='de')
        res = client.post('/api/v1/fetch_bundle/', data)
        assert res.status_code == 200

        recipe_names = set(r['name'] for r in res.data['recipes'])
        assert recipe_names == {'german', 'any', 'both'}

    def test_it_filters_by_locale_with_json(self, api_client):
        """
        Ensure that we correctly pull data from the request such that
        both form-encoded and JSON-encoded requests work.
        """
        english = LocaleFactory(code='en-US')
        german = LocaleFactory(code='de')

        RecipeFactory(name='english', enabled=True, locales=[english])
        RecipeFactory(name='german', enabled=True, locales=[german])
        RecipeFactory(name='any', enabled=True, locales=[])
        RecipeFactory(name='both', enabled=True, locales=[english, german])
        RecipeFactory(name='disabled', enabled=False, locales=[german])

        data = ClientParametersFactory(locale='de')
        res = api_client.post('/api/v1/fetch_bundle/', data, format='json')
        assert res.status_code == 200

        recipe_names = set(r['name'] for r in res.data['recipes'])
        assert recipe_names == {'german', 'any', 'both'}

    def test_it_makes_no_db_queries(self, client):
        # Prepare some interesting data
        recipe = RecipeFactory(enabled=True)

        # Warm up the cache
        data = ClientParametersFactory()
        res1 = client.post('/api/v1/fetch_bundle/', data)
        assert res1.status_code == 200
        assert res1.data['recipes'][0]['name'] == recipe.name

        # Fire!
        queries = CaptureQueriesContext(connection)
        with queries:
            res2 = client.post('/api/v1/fetch_bundle/', data)
            assert res2.status_code == 200
        assert res1.data == res2.data
        assert list(queries) == []

    @pytest.mark.parametrize('name', ['locale', 'user_id', 'release_channel', 'version'])
    def test_required_parameters_are_required(self, client, name):
        data = ClientParametersFactory()
        del data[name]
        res = client.post('/api/v1/fetch_bundle/', data)
        assert res.status_code == 400
        assert res.data == {name: ['This field is required.']}

    def test_it_includes_the_client_country(self, client):
        with patch('normandy.recipes.models.get_country_code') as get_country_code:
            get_country_code.return_value = 'fr'

            data = ClientParametersFactory()
            res = client.post('/api/v1/fetch_bundle/', data)
            assert res.status_code == 200
            assert res.data == {'recipes': [], 'country': 'fr'}
