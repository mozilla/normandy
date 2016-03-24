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

    action_url = reverse('action-implementation', kwargs={
        'name': action.name,
        'impl_hash': action.implementation_hash,
    })
    assert serializer.data == {
        'name': recipe.name,
        'id': recipe.id,
        'revision_id': recipe.revision_id,
        'action': {
            'name': action.name,
            'implementation_url': Whatever.endswith(action_url),
            'arguments_schema': action.arguments_schema,
        },
        'arguments': {
            'foo': 'bar',
        }
    }
