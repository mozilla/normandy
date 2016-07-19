import pytest
from rest_framework import serializers

import json

from normandy.base.tests import Whatever
from normandy.recipes.tests import RecipeFactory, ActionFactory
from normandy.recipes.api.serializers import RecipeSerializer, ActionSerializer


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

    def test_it_validates_arguments(self):
        schema = json.loads(
            open('normandy/recipes/static/actions/console-log/package.json').read()
        )

        mockAction = ActionFactory(
            name='console-log',
            arguments_schema=schema['normandy']['argumentsSchema']
        )

        # If the action specified cannot be found, raise validation
        # error indicating the arguments schema could not be loaded
        serializer = RecipeSerializer(data={
            'action': 'action-that-doesnt-exist', 'arguments': {}
        })

        serializer.is_valid()
        assert serializer.errors['arguments'] == ['Could not find arguments schema.']
        assert pytest.raises(serializers.ValidationError)

        # If the action can be found, raise validation error
        # with the arguments error formatted appropriately
        serializer = RecipeSerializer(data={
            'action': 'console-log', 'arguments': {'message': ''}
        })

        serializer.is_valid()
        assert serializer.errors['arguments'] == {'message': 'This field may not be blank.'}
        assert pytest.raises(serializers.ValidationError)

        # If the action can be found, and the arguments passed
        # are accurate, serializer should be valid
        serializer = RecipeSerializer(data={
            'name': 'bar', 'enabled': True, 'filter_expression': '[]',
            'action': 'console-log', 'arguments': {'message': 'foo'}
        })

        serializer.is_valid()
        assert serializer.validated_data == {
            'name': 'bar',
            'enabled': True,
            'filter_expression': '[]',
            'action': mockAction,
            'arguments': {
                'message': 'foo'
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
