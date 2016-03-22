import pytest

from rest_framework.reverse import reverse

from normandy.base.tests import Whatever
from normandy.recipes.tests import RecipeFactory
from normandy.recipes.api.serializers import RecipeSerializer


@pytest.mark.django_db()
def test_recipe_serializer(rf):
    recipe = RecipeFactory(arguments={'foo': 'bar'})
    action = recipe.action
    serializer = RecipeSerializer(recipe, context={'request': rf.get('/')})

    action_url = reverse('action-implementation', args=[action.name])
    assert serializer.data == {
        'name': recipe.name,
        'implementation': {
            'name': action.name,
            'hash': Whatever(lambda h: len(h) == 40),
            'url': Whatever.endswith(action_url),
        },
        'arguments': {
            'foo': 'bar',
        }
    }
