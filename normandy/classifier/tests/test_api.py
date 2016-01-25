import pytest

from normandy.base.tests import Whatever
from normandy.recipes.tests import RecipeActionFactory, RecipeFactory


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
        assert res.status_code == 200
        assert len(res.data['recipes']) == 1
        assert res.data['recipes'][0] == {
            'name': recipe.name,
            'actions': [
                {
                    "name": action.name,
                    "implementation": {
                        "hash": Whatever(lambda h: len(h) == 40),
                        "url": action.get_absolute_url(),
                    },
                    "arguments": {
                        'foo': 'bar',
                    },
                },
            ],
        }

    def test_it_filters_by_locale(self, client):
        RecipeFactory(name='english', enabled=True, locale='en-US')
        RecipeFactory(name='german', enabled=True, locale='de')
        RecipeFactory(name='any', enabled=True, locale='')
        RecipeFactory(name='disabled', enabled=False, locale='de')

        res = client.post('/api/v1/fetch_bundle/', {'locale': 'de'})
        assert res.status_code == 200

        recipe_names = set(r['name'] for r in res.data['recipes'])
        assert recipe_names == {'german', 'any'}
