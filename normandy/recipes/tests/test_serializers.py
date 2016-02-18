import pytest

from rest_framework.reverse import reverse

from normandy.base.tests import Whatever
from normandy.recipes.tests import RecipeActionFactory
from normandy.recipes.api.serializers import RecipeActionSerializer, RecipeSerializer


@pytest.mark.django_db()
def test_recipe_action_serializer(rf):
    recipe_action = RecipeActionFactory(arguments={'foo': 'bar'})

    serializer = RecipeActionSerializer(recipe_action, context={'request': rf.get('/')})
    action = recipe_action.action
    action_url = reverse('action-implementation', args=[action.name])
    assert serializer.data == {
        "name": action.name,
        "implementation": {
            "hash": action.implementation_hash,
            "url": Whatever.endswith(action_url),
        },
        "arguments": {
            'foo': 'bar',
        }
    }


@pytest.mark.django_db()
def test_recipe_serializer(rf):
    recipe_action = RecipeActionFactory(arguments={'foo': 'bar'})
    recipe = recipe_action.recipe
    action = recipe_action.action
    serializer = RecipeSerializer(recipe, context={'request': rf.get('/')})

    action_url = reverse('action-implementation', args=[action.name])
    assert serializer.data == {
        'name': recipe.name,
        'actions': [
            {
                "name": action.name,
                "implementation": {
                    "hash": Whatever(lambda h: len(h) == 40),
                    "url": Whatever.endswith(action_url),
                },
                "arguments": {
                    'foo': 'bar',
                }
            }
        ],
    }
