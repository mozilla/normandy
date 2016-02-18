import pytest
from rest_framework.reverse import reverse

from normandy.base.tests import Whatever
from normandy.recipes.tests import RecipeActionFactory, RecipeFactory, LocaleFactory


@pytest.mark.django_db
class TestFetchBundleAPI(object):

    def test_it_works(self, client):
        res = client.post('/api/v1/fetch_bundle/')
        assert res.status_code == 200
        assert res.data == {'recipes': []}

    def test_it_serves_recipes(self, client):
        recipe_action = RecipeActionFactory(arguments={'foo': 'bar'})
        res = client.post('/api/v1/fetch_bundle/')

        action = recipe_action.action
        recipe = recipe_action.recipe
        impl_url = reverse('action-implementation', args=[action.name])
        assert res.status_code == 200
        assert res.data['recipes'] == [{
            'name': recipe.name,
            'actions': [
                {
                    "name": action.name,
                    "implementation": {
                        "hash": Whatever(lambda h: len(h) == 40),
                        "url": Whatever.endswith(impl_url),
                    },
                    "arguments": {
                        'foo': 'bar',
                    },
                },
            ],
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
