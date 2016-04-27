import pytest

from rest_framework.reverse import reverse

from normandy.base.tests import Whatever
from normandy.recipes.tests import BundleFactory, RecipeFactory
from normandy.recipes.api.serializers import BundleSerializer, RecipeSerializer


@pytest.mark.django_db()
class TestRecipeSerializer:
    def test_it_works(self, rf):
        recipe = RecipeFactory(arguments={'foo': 'bar'})
        action = recipe.action
        serializer = RecipeSerializer(recipe, context={'request': rf.get('/')})

        action_url = reverse('recipes:action-implementation', kwargs={
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
            },
            'start_time': recipe.start_time,
            'end_time': recipe.end_time,
        }

    def test_it_uses_cdn_url(self, rf, settings):
        settings.CDN_URL = 'https://example.com/cdn/'
        recipe = RecipeFactory()
        serializer = RecipeSerializer(recipe, context={'request': rf.get('/')})
        assert serializer.data['action']['implementation_url'].startswith(settings.CDN_URL)


@pytest.mark.django_db()
def test_bundle_serializer(rf):
    recipe = RecipeFactory()
    bundle = BundleFactory(recipes=[recipe])
    serializer = BundleSerializer(bundle, context={'request': rf.get('/')})

    assert serializer.data['recipes'] == [{
        'name': recipe.name,
        'id': recipe.id,
        'revision_id': recipe.revision_id,
        'action': Whatever(),
        'arguments': Whatever(),
        'start_time': recipe.start_time,
        'end_time': recipe.end_time,
    }]
