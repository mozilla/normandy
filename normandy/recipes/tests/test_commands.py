from unittest.mock import patch

from django.core.management import call_command

import pytest
from reversion.models import Version

from normandy.recipes.models import Action
from normandy.recipes.tests import ActionFactory, RecipeFactory


@pytest.yield_fixture
def mock_action(settings):
    implementations = {}
    schemas = {}
    settings.ACTIONS = {}

    impl_patch = patch(
        'normandy.recipes.management.commands.update_actions.get_implementation',
        lambda name: implementations[name]
    )
    schema_patch = patch(
        'normandy.recipes.management.commands.update_actions.get_arguments_schema',
        lambda name: schemas[name]
    )

    def _mock_action(name, implementation, schema):
        settings.ACTIONS[name] = '/fake/path'
        implementations[name] = implementation
        schemas[name] = schema

    with impl_patch, schema_patch:
        yield _mock_action


@pytest.mark.django_db
class TestUpdateActions(object):
    def test_it_works(self):
        """
        Verify that the update_actions command doesn't throw an error.
        """
        call_command('update_actions')

    def test_it_creates_new_actions(self, mock_action):
        mock_action('test-action', 'console.log("foo");', {'type': 'int'})

        call_command('update_actions')
        assert Action.objects.count() == 1

        action = Action.objects.all()[0]
        assert action.name == 'test-action'
        assert action.implementation == 'console.log("foo");'
        assert action.arguments_schema == {'type': 'int'}

    def test_it_updates_existing_actions(self, mock_action):
        action = ActionFactory(
            name='test-action',
            implementation='old_impl',
            arguments_schema={},
        )
        mock_action(action.name, 'new_impl', {'type': 'int'})

        call_command('update_actions')
        assert Action.objects.count() == 1

        action.refresh_from_db()
        assert action.implementation == 'new_impl'
        assert action.arguments_schema == {'type': 'int'}

    def test_it_doesnt_disable_recipes(self, mock_action):
        recipe = RecipeFactory(
            action__name='test-action',
            action__implementation='old',
            enabled=True
        )
        action = recipe.action
        mock_action(action.name, 'impl', action.arguments_schema)

        call_command('update_actions')
        recipe.refresh_from_db()
        assert recipe.enabled

    def test_it_only_updates_given_actions(self, mock_action):
        update_action = ActionFactory(name='update-action', implementation='old')
        dont_update_action = ActionFactory(name='dont-update-action', implementation='old')

        mock_action(update_action.name, 'new', update_action.arguments_schema)
        mock_action(dont_update_action.name, 'new', dont_update_action.arguments_schema)

        call_command('update_actions', 'update-action')
        update_action.refresh_from_db()
        assert update_action.implementation == 'new'
        dont_update_action.refresh_from_db()
        assert dont_update_action.implementation == 'old'

    def test_it_ignores_missing_actions(self, mock_action):
        dont_update_action = ActionFactory(name='dont-update-action', implementation='old')
        mock_action(dont_update_action.name, 'new', dont_update_action.arguments_schema)

        call_command('update_actions', 'missing-action')
        dont_update_action.refresh_from_db()
        assert dont_update_action.implementation == 'old'

    def test_it_sets_the_revision_comment(self, mock_action):
        mock_action('test-action', 'console.log("foo");', {'type': 'int'})

        call_command('update_actions')
        assert Action.objects.count() == 1

        action = Action.objects.all()[0]
        versions = Version.objects.get_for_object(action)
        assert versions.count() == 1

        version = versions[0]
        assert version.revision.comment == 'Updating actions.'
