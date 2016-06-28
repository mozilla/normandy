import pytest

from normandy.base.tests import Whatever
from normandy.recipes.tests import RecipeFactory, ActionFactory
from normandy.recipes.api.serializers import (
    ActionSerializer, RecipeSerializer, SignedRecipeSerializer)


@pytest.mark.django_db()
class TestRecipeSerializer:
    def test_it_works(self, rf):
        recipe = RecipeFactory(arguments={'foo': 'bar'})
        action = recipe.action
        serializer = RecipeSerializer(recipe, context={'request': rf.get('/')})

        assert serializer.data == {
            'name': recipe.name,
            'id': recipe.id,
            'last_updated': Whatever(),
            'enabled': recipe.enabled,
            'filter_expression': recipe.filter_expression,
            'revision_id': recipe.revision_id,
            'action': action.name,
            'arguments': {
                'foo': 'bar',
            },
            'current_approval_request': Whatever(),
            'approval': Whatever(),
            'is_approved': recipe.is_approved
        }


@pytest.mark.django_db()
class TestActionSerializer:
    def test_it_uses_cdn_url(self, rf, settings):
        settings.CDN_URL = 'https://example.com/cdn/'
        action = ActionFactory()
        serializer = ActionSerializer(action, context={'request': rf.get('/')})
        assert serializer.data['implementation_url'].startswith(settings.CDN_URL)


@pytest.mark.django_db()
class TestSignedRecipeSerializer:
    def test_it_works_with_signature(self, rf):
        recipe = RecipeFactory(signed=True)
        action = recipe.action
        serializer = SignedRecipeSerializer(instance=recipe, context={'request': rf.get('/')})

        assert serializer.data == {
            'signature': {
                'signature': 'fake signature',
                'timestamp': Whatever(),
                'x5u': Whatever(),
            },
            'recipe': {
                'name': recipe.name,
                'id': recipe.id,
                'enabled': recipe.enabled,
                'filter_expression': recipe.filter_expression,
                'revision_id': recipe.revision_id,
                'action': action.name,
                'arguments': recipe.arguments,
                'current_approval_request': Whatever(),
                'approval': Whatever(),
                'is_approved': recipe.is_approved,
                'last_updated': Whatever(),
            }
        }

    def test_it_works_with_no_signature(self, rf):
        recipe = RecipeFactory(signed=False)
        action = recipe.action
        serializer = SignedRecipeSerializer(instance=recipe, context={'request': rf.get('/')})

        assert serializer.data == {
            'signature': None,
            'recipe': {
                'name': recipe.name,
                'id': recipe.id,
                'enabled': recipe.enabled,
                'filter_expression': recipe.filter_expression,
                'revision_id': recipe.revision_id,
                'action': action.name,
                'arguments': recipe.arguments,
                'current_approval_request': Whatever(),
                'approval': Whatever(),
                'is_approved': recipe.is_approved,
                'last_updated': Whatever(),
            }
        }
