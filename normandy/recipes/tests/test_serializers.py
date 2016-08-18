import pytest
from rest_framework import serializers

from normandy.base.tests import Whatever
from normandy.recipes.tests import RecipeFactory, ActionFactory, ARGUMENTS_SCHEMA
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

    # If the action specified cannot be found, raise validation
    # error indicating the arguments schema could not be loaded
    def test_validation_with_wrong_action(self):
        serializer = RecipeSerializer(data={
            'action': 'action-that-doesnt-exist', 'arguments': {}
        })

        with pytest.raises(serializers.ValidationError):
            serializer.is_valid(raise_exception=True)

        assert serializer.errors['arguments'] == ['Could not find arguments schema.']

    # If the action can be found, raise validation error
    # with the arguments error formatted appropriately
    def test_validation_with_wrong_arguments(self):
        ActionFactory(
            name='show-heartbeat',
            arguments_schema=ARGUMENTS_SCHEMA
        )

        serializer = RecipeSerializer(data={
            'action': 'show-heartbeat',
            'arguments': {
                'surveyId': '',
                'surveys': [
                    {'title': '', 'weight': 1},
                    {'title': 'bar', 'weight': 1},
                    {'title': 'foo', 'weight': 0},
                    {'title': 'baz', 'weight': 'lorem ipsum'}
                ]
            }
        })

        with pytest.raises(serializers.ValidationError):
            serializer.is_valid(raise_exception=True)

        assert serializer.errors['arguments'] == {
            'surveyId': 'This field may not be blank.',
            'surveys': {
                0: {'title': 'This field may not be blank.'},
                2: {'weight': '0 is less than the minimum of 1'},
                3: {'weight': '\'lorem ipsum\' is not of type \'integer\''}
            }
        }

    def test_validation_with_valid_data(self):
        mockAction = ActionFactory(
            name='show-heartbeat',
            arguments_schema=ARGUMENTS_SCHEMA
        )

        serializer = RecipeSerializer(data={
            'name': 'bar', 'enabled': True, 'filter_expression': '[]',
            'action': 'show-heartbeat',
            'arguments': {
                'surveyId': 'lorem-ipsum-dolor',
                'surveys': [
                    {'title': 'adipscing', 'weight': 1},
                    {'title': 'consequetar', 'weight': 1}
                ]
            }
        })

        assert serializer.is_valid()
        assert serializer.validated_data == {
            'name': 'bar',
            'enabled': True,
            'filter_expression': '[]',
            'action': mockAction,
            'arguments': {
                'surveyId': 'lorem-ipsum-dolor',
                'surveys': [
                    {'title': 'adipscing', 'weight': 1},
                    {'title': 'consequetar', 'weight': 1}
                ]
            }
        }
        assert serializer.errors == {}


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
        context = {'request': rf.get('/')}
        combined_serializer = SignedRecipeSerializer(instance=recipe, context=context)
        recipe_serializer = RecipeSerializer(instance=recipe, context=context)

        assert combined_serializer.data == {
            'signature': {
                'signature': 'fake signature',
                'timestamp': Whatever(),
                'x5u': Whatever(),
                'public_key': Whatever(),
            },
            'recipe': recipe_serializer.data,
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
