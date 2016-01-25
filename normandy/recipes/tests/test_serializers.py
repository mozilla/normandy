import pytest

from normandy.base.tests import Whatever
from normandy.recipes.tests import RecipeActionFactory
from normandy.recipes.serializers import RecipeActionSerializer, RecipeSerializer


@pytest.mark.django_db()
def test_recipe_action_serializer():
    recipe_action = RecipeActionFactory(arguments={'foo': 'bar'})

    serializer = RecipeActionSerializer(recipe_action)
    action = recipe_action.action
    assert serializer.data == {
        "name": action.name,
        "implementation": {
            "hash": action.implementation_hash,
            "url": Whatever(lambda url: url.endswith(action.implementation.url)),
        },
        "arguments": {
            'foo': 'bar',
        }
    }


@pytest.mark.django_db()
def test_recipe_serializer():
    recipe_action = RecipeActionFactory(arguments={'foo': 'bar'})
    recipe = recipe_action.recipe
    action = recipe_action.action
    serializer = RecipeSerializer(recipe)

    assert serializer.data == {
        'name': recipe.name,
        'actions': [
            {
                "name": action.name,
                "implementation": {
                    "hash": Whatever(lambda h: len(h) == 40),
                    "url": Whatever(lambda url: url.endswith(action.implementation.url)),
                },
                "arguments": {
                    'foo': 'bar',
                }
            }
        ],
    }
