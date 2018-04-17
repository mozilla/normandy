import json
from unittest.mock import patch
from datetime import timedelta

from django.core.management import call_command, CommandError

import pytest

from normandy.base.tests import UserFactory
from normandy.recipes.models import Action
from normandy.recipes.tests import ActionFactory, RecipeFactory


@pytest.yield_fixture
def mock_action(settings, tmpdir):
    implementations = {}
    schemas = {}

    impl_patch = patch(
        'normandy.recipes.management.commands.update_actions.get_implementation',
        lambda name: implementations[name]
    )
    schema_by_implementation_patch = patch(
        'normandy.recipes.management.commands.update_actions.get_arguments_schema_by_implementation',
        lambda name, _: schemas[name]
    )
    schema_by_schemas_patch = patch(
        'normandy.recipes.management.commands.update_actions.get_arguments_schema_by_schemas',
        lambda name, _, _2: schemas[name]
    )

    # 'tmpdir' is a LocalPath object, turn it into a regular path string with str().
    settings.ACTIONS_ROOT_DIRECTORY = str(tmpdir)
    settings.ACTIONS_SCHEMA_DIRECTORY = str(tmpdir)

    schemas_json = tmpdir.join('schemas.json')
    # By default, make it an empty JSON file
    schemas_json.write(json.dumps({}))

    def _mock_action(name, schema, implementation=None):
        tmpdir.mkdir(name)
        if implementation:
            implementations[name] = implementation
        else:
            schemas_json.write(json.dumps({
                name: schema
            }))
        schemas[name] = schema

    with impl_patch, schema_by_implementation_patch, schema_by_schemas_patch:
        yield _mock_action


@pytest.mark.django_db
class TestUpdateActions(object):
    def test_it_works(self):
        """
        Verify that the update_actions command doesn't throw an error.
        """
        call_command('update_actions')

    def test_it_creates_new_actions(self, mock_action):
        mock_action('test-action', {'type': 'int'}, 'console.log("foo");')

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
        mock_action(action.name, {'type': 'int'}, 'new_impl')

        call_command('update_actions')
        assert Action.objects.count() == 1

        action.refresh_from_db()
        assert action.implementation == 'new_impl'
        assert action.arguments_schema == {'type': 'int'}

    def test_it_creates_new_remote_actions(self, mock_action):
        mock_action('test-remote-action', {'type': 'int'})

        call_command('update_actions')
        assert Action.objects.count() == 1

        action = Action.objects.all()[0]
        assert action.name == 'test-remote-action'
        assert action.implementation is None
        assert action.arguments_schema == {'type': 'int'}

    def test_it_updates_existing_remote_actions(self, mock_action):
        action = ActionFactory(
            name='test-action',
            implementation=None,
            arguments_schema={},
        )
        mock_action(action.name, {'type': 'int'})

        call_command('update_actions')
        assert Action.objects.count() == 1

        action.refresh_from_db()
        assert action.implementation is None
        assert action.arguments_schema == {'type': 'int'}

    def test_it_updates_existing_drops_implementation(self, mock_action):
        action = ActionFactory(
            name='test-action',
            implementation='old_impl',
            arguments_schema={},
        )
        mock_action(action.name, {'type': 'int'})

        call_command('update_actions')
        assert Action.objects.count() == 1

        action.refresh_from_db()
        assert action.implementation is None
        assert action.implementation_hash is None
        assert action.arguments_schema == {'type': 'int'}

    def test_it_doesnt_disable_recipes(self, mock_action):
        action = ActionFactory(name='test-action', implementation='old')
        recipe = RecipeFactory(action=action, approver=UserFactory(), enabled=True)
        action = recipe.action
        mock_action(action.name, 'impl', action.arguments_schema)

        call_command('update_actions')
        recipe.refresh_from_db()
        assert recipe.enabled

    def test_it_only_updates_given_actions(self, mock_action):
        update_action = ActionFactory(name='update-action', implementation='old')
        dont_update_action = ActionFactory(name='dont-update-action', implementation='old')

        mock_action(update_action.name, update_action.arguments_schema, 'new')
        mock_action(dont_update_action.name, dont_update_action.arguments_schema, 'new')

        call_command('update_actions', 'update-action')
        update_action.refresh_from_db()
        assert update_action.implementation == 'new'
        dont_update_action.refresh_from_db()
        assert dont_update_action.implementation == 'old'

    def test_it_ignores_missing_actions(self, mock_action):
        dont_update_action = ActionFactory(name='dont-update-action', implementation='old')
        mock_action(dont_update_action.name, dont_update_action.arguments_schema, 'new')

        with pytest.raises(CommandError):
            call_command('update_actions', 'missing-action')


class TestUpdateSignatures(object):
    @pytest.mark.django_db
    def test_it_works(self, mocker):
        """
        Verify that the update_recipe_signatures command doesn't throw an error.
        """
        call_command('update_signatures')

    def test_it_calls_other_update_signature_commands(self, mocker):
        prefix = 'normandy.recipes.management.commands'
        update_recipe_signatures = mocker.patch(f'{prefix}.update_recipe_signatures.Command')
        update_action_signatures = mocker.patch(f'{prefix}.update_action_signatures.Command')

        call_command('update_signatures')
        update_action_signatures.return_value.execute.assert_called_once()
        update_recipe_signatures.return_value.execute.assert_called_once()


@pytest.mark.django_db
class TestUpdateRecipeSignatures(object):
    def test_it_works(self):
        """
        Verify that the update_recipe_signatures command doesn't throw an error.
        """
        call_command('update_recipe_signatures')

    def test_it_signs_unsigned_enabled_recipes(self, mocked_autograph):
        r = RecipeFactory(approver=UserFactory(), enabled=True, signed=False)
        call_command('update_recipe_signatures')
        r.refresh_from_db()
        assert r.signature is not None

    def test_it_signs_out_of_date_recipes(self, settings, mocked_autograph):
        r = RecipeFactory(approver=UserFactory(), enabled=True, signed=True)
        r.signature.timestamp -= timedelta(seconds=settings.AUTOGRAPH_SIGNATURE_MAX_AGE * 2)
        r.signature.signature = 'old signature'
        r.signature.save()
        call_command('update_recipe_signatures')
        r.refresh_from_db()
        assert r.signature.signature is not 'old signature'

    def test_it_unsigns_disabled_recipes(self, mocked_autograph):
        r = RecipeFactory(enabled=False, signed=True)
        call_command('update_recipe_signatures')
        r.refresh_from_db()
        assert r.signature is None

    def test_it_unsigns_out_of_date_disabled_recipes(self, settings, mocked_autograph):
        r = RecipeFactory(enabled=False, signed=True)
        r.signature.timestamp -= timedelta(seconds=settings.AUTOGRAPH_SIGNATURE_MAX_AGE * 2)
        r.signature.save()
        call_command('update_recipe_signatures')
        r.refresh_from_db()
        assert r.signature is None

    def test_it_resigns_signed_recipes_with_force(self, mocked_autograph):
        r = RecipeFactory(approver=UserFactory(), enabled=True, signed=True)
        r.signature.signature = 'old signature'
        r.signature.save()
        call_command('update_recipe_signatures', '--force')
        r.refresh_from_db()
        assert r.signature.signature is not 'old signature'

    def test_it_does_not_resign_up_to_date_recipes(self, settings, mocked_autograph):
        r = RecipeFactory(approver=UserFactory(), enabled=True, signed=True)
        r.signature.signature = 'original signature'
        r.signature.save()
        call_command('update_recipe_signatures')
        r.refresh_from_db()
        assert r.signature.signature == 'original signature'


@pytest.mark.django_db
class TestUpdateActionSignatures(object):
    def test_it_works(self):
        """
        Verify that the update_action_signatures command doesn't throw an error.
        """
        call_command('update_action_signatures')

    def test_it_signs_unsigned_actions(self, mocked_autograph):
        a = ActionFactory(signed=False)
        call_command('update_action_signatures')
        a.refresh_from_db()
        assert a.signature is not None

    def test_it_signs_out_of_date_actions(self, settings, mocked_autograph):
        a = ActionFactory(signed=True)
        a.signature.timestamp -= timedelta(seconds=settings.AUTOGRAPH_SIGNATURE_MAX_AGE * 2)
        a.signature.signature = 'old signature'
        a.signature.save()
        call_command('update_action_signatures')
        a.refresh_from_db()
        assert a.signature.signature is not 'old signature'

    def test_it_resigns_signed_actions_with_force(self, mocked_autograph):
        a = ActionFactory(signed=True)
        a.signature.signature = 'old signature'
        a.signature.save()
        call_command('update_action_signatures', '--force')
        a.refresh_from_db()
        assert a.signature.signature != 'old signature'

    def test_it_does_not_resign_up_to_date_actions(self, settings, mocked_autograph):
        a = ActionFactory(signed=True)
        a.signature.signature = 'original signature'
        a.signature.save()
        call_command('update_action_signatures')
        a.refresh_from_db()
        assert a.signature.signature == 'original signature'
