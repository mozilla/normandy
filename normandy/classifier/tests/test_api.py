from django.db import connection
from django.test.utils import CaptureQueriesContext

import pytest
from rest_framework.reverse import reverse

from normandy.base.tests import Whatever
from normandy.recipes.tests import RecipeFactory, LocaleFactory


@pytest.mark.django_db
class TestFetchBundleAPI(object):

    def test_it_works(self, client):
        res = client.post('/api/v1/fetch_bundle/')
        assert res.status_code == 200
        assert res.data == {'recipes': []}

    def test_it_serves_recipes(self, client):
        recipe = RecipeFactory(arguments={'foo': 'bar'})
        res = client.post('/api/v1/fetch_bundle/')

        action = recipe.action
        impl_url = reverse('action-implementation', kwargs={
            'name': action.name,
            'impl_hash': action.implementation_hash,
        })
        assert res.status_code == 200
        assert res.data['recipes'] == [{
            'name': recipe.name,
            'implementation': {
                'name': action.name,
                'hash': Whatever(lambda h: len(h) == 40),
                'url': Whatever.endswith(impl_url),
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

        res = client.post('/api/v1/fetch_bundle/', {'locale': 'de'})
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

        res = api_client.post('/api/v1/fetch_bundle/', {'locale': 'de'}, format='json')
        assert res.status_code == 200

        recipe_names = set(r['name'] for r in res.data['recipes'])
        assert recipe_names == {'german', 'any', 'both'}

    @pytest.mark.xfail
    def test_it_makes_no_db_queries(self, client):
        # Prepare some interesting data
        recipe = RecipeFactory(enabled=True)

        # Warm up the cache
        res1 = client.post('/api/v1/fetch_bundle/', {'locale': 'de'})
        assert res1.status_code == 200
        assert res1.data['recipes'][0]['name'] == recipe.name

        # Fire!
        queries = CaptureQueriesContext(connection)
        with queries:
            res2 = client.post('/api/v1/fetch_bundle/', {'locale': 'de'})
            assert res2.status_code == 200
        assert res1.data == res2.data
        assert list(queries) == []
