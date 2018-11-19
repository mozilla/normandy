import hashlib
import json
from unittest.mock import patch
from datetime import timedelta

from django.core.management import call_command, CommandError

import pytest

from normandy.base.tests import UserFactory
from normandy.recipes.models import Action, Recipe
from normandy.recipes.tests import ActionFactory, RecipeFactory


@pytest.yield_fixture
def mock_action(settings, tmpdir):
    implementations = {}
    schemas = {}

    impl_patch = patch(
        "normandy.recipes.management.commands.update_actions.get_implementation",
        lambda name: implementations[name],
    )
    schema_by_implementation_patch = patch(
        "normandy.recipes.management.commands.update_actions"
        ".get_arguments_schema_by_implementation",
        lambda name, _: schemas[name],
    )
    schema_by_schemas_patch = patch(
        "normandy.recipes.management.commands.update_actions.get_arguments_schema_by_schemas",
        lambda name, _, _2: schemas[name],
    )

    # 'tmpdir' is a LocalPath object, turn it into a regular path string with str().
    settings.ACTIONS_ROOT_DIRECTORY = str(tmpdir)
    settings.ACTIONS_SCHEMA_DIRECTORY = str(tmpdir)

    schemas_json = tmpdir.join("schemas.json")
    # By default, make it an empty JSON file
    schemas_json.write(json.dumps({}))

    def _mock_action(name, schema, implementation=None):
        tmpdir.mkdir(name)
        if implementation:
            implementations[name] = implementation
        else:
            schemas_json.write(json.dumps({name: schema}))
        schemas[name] = schema

    with impl_patch, schema_by_implementation_patch, schema_by_schemas_patch:
        yield _mock_action


@pytest.mark.django_db
class TestUpdateActions(object):
    def test_it_works(self):
        """
        Verify that the update_actions command doesn't throw an error.
        """
        call_command("update_actions")

    def test_it_creates_new_actions(self, mock_action):
        mock_action("test-action", {"type": "int"}, 'console.log("foo");')

        call_command("update_actions")
        assert Action.objects.count() == 1

        action = Action.objects.all()[0]
        assert action.name == "test-action"
        assert action.implementation == 'console.log("foo");'
        assert action.arguments_schema == {"type": "int"}

    def test_it_updates_existing_actions(self, mock_action):
        action = ActionFactory(name="test-action", implementation="old_impl", arguments_schema={})
        mock_action(action.name, {"type": "int"}, "new_impl")

        call_command("update_actions")
        assert Action.objects.count() == 1

        action.refresh_from_db()
        assert action.implementation == "new_impl"
        assert action.arguments_schema == {"type": "int"}

    def test_it_creates_new_actions_without_implementation(self, mock_action):
        mock_action("test-action", {"type": "int"})

        call_command("update_actions")
        assert Action.objects.count() == 1

        action = Action.objects.all()[0]
        assert action.name == "test-action"
        assert action.implementation is None
        assert action.arguments_schema == {"type": "int"}

    def test_it_updates_existing_actions_without_implementation(self, mock_action):
        action = ActionFactory(name="test-action", implementation=None, arguments_schema={})
        mock_action(action.name, {"type": "int"})

        call_command("update_actions")
        assert Action.objects.count() == 1

        action.refresh_from_db()
        assert action.implementation is None
        assert action.arguments_schema == {"type": "int"}

    def test_it_updates_existing_drops_implementation(self, mock_action):
        action = ActionFactory(name="test-action", implementation="old_impl", arguments_schema={})
        mock_action(action.name, {"type": "int"})
        old_implementation = action.implementation
        old_implementation_hash = action.implementation_hash

        call_command("update_actions")
        assert Action.objects.count() == 1

        action.refresh_from_db()
        assert action.implementation == old_implementation
        assert action.implementation_hash == old_implementation_hash
        assert action.arguments_schema == {"type": "int"}

    def test_it_doesnt_disable_recipes(self, mock_action):
        action = ActionFactory(name="test-action", implementation="old")
        recipe = RecipeFactory(action=action, approver=UserFactory(), enabler=UserFactory())
        action = recipe.action
        mock_action(action.name, "impl", action.arguments_schema)

        call_command("update_actions")
        recipe.refresh_from_db()
        assert recipe.enabled

    def test_it_only_updates_given_actions(self, mock_action):
        update_action = ActionFactory(name="update-action", implementation="old")
        dont_update_action = ActionFactory(name="dont-update-action", implementation="old")

        mock_action(update_action.name, update_action.arguments_schema, "new")
        mock_action(dont_update_action.name, dont_update_action.arguments_schema, "new")

        call_command("update_actions", "update-action")
        update_action.refresh_from_db()
        assert update_action.implementation == "new"
        dont_update_action.refresh_from_db()
        assert dont_update_action.implementation == "old"

    def test_it_ignores_missing_actions(self, mock_action):
        dont_update_action = ActionFactory(name="dont-update-action", implementation="old")
        mock_action(dont_update_action.name, dont_update_action.arguments_schema, "new")

        with pytest.raises(CommandError):
            call_command("update_actions", "missing-action")


class TestUpdateSignatures(object):
    @pytest.mark.django_db
    def test_it_works(self, mocker):
        """
        Verify that the update_recipe_signatures command doesn't throw an error.
        """
        call_command("update_signatures")

    def test_it_calls_other_update_signature_commands(self, mocker):
        prefix = "normandy.recipes.management.commands"
        update_recipe_signatures = mocker.patch(f"{prefix}.update_recipe_signatures.Command")
        update_action_signatures = mocker.patch(f"{prefix}.update_action_signatures.Command")

        call_command("update_signatures")
        update_action_signatures.return_value.execute.assert_called_once()
        update_recipe_signatures.return_value.execute.assert_called_once()


@pytest.mark.django_db
class TestUpdateRecipeSignatures(object):
    def test_it_works(self):
        """
        Verify that the update_recipe_signatures command doesn't throw an error.
        """
        call_command("update_recipe_signatures")

    def test_it_signs_unsigned_enabled_recipes(self, mocked_autograph):
        r = RecipeFactory(approver=UserFactory(), enabler=UserFactory(), signed=False)
        call_command("update_recipe_signatures")
        r.refresh_from_db()
        assert r.signature is not None

    def test_it_signs_out_of_date_recipes(self, settings, mocked_autograph):
        r = RecipeFactory(approver=UserFactory(), enabler=UserFactory(), signed=True)
        r.signature.timestamp -= timedelta(seconds=settings.AUTOGRAPH_SIGNATURE_MAX_AGE * 2)
        r.signature.signature = "old signature"
        r.signature.save()
        call_command("update_recipe_signatures")
        r.refresh_from_db()
        assert r.signature.signature is not "old signature"

    def test_it_unsigns_disabled_recipes(self, mocked_autograph):
        r = RecipeFactory(signed=True)
        call_command("update_recipe_signatures")
        r.refresh_from_db()
        assert r.signature is None

    def test_it_unsigns_out_of_date_disabled_recipes(self, settings, mocked_autograph):
        r = RecipeFactory(signed=True)
        r.signature.timestamp -= timedelta(seconds=settings.AUTOGRAPH_SIGNATURE_MAX_AGE * 2)
        r.signature.save()
        call_command("update_recipe_signatures")
        r.refresh_from_db()
        assert r.signature is None

    def test_it_resigns_signed_recipes_with_force(self, mocked_autograph):
        r = RecipeFactory(approver=UserFactory(), enabler=UserFactory(), signed=True)
        r.signature.signature = "old signature"
        r.signature.save()
        call_command("update_recipe_signatures", "--force")
        r.refresh_from_db()
        assert r.signature.signature is not "old signature"

    def test_it_does_not_resign_up_to_date_recipes(self, settings, mocked_autograph):
        r = RecipeFactory(approver=UserFactory(), enabler=UserFactory(), signed=True)
        r.signature.signature = "original signature"
        r.signature.save()
        call_command("update_recipe_signatures")
        r.refresh_from_db()
        assert r.signature.signature == "original signature"


@pytest.mark.django_db
class TestUpdateActionSignatures(object):
    def test_it_works(self):
        """
        Verify that the update_action_signatures command doesn't throw an error.
        """
        call_command("update_action_signatures")

    def test_it_signs_unsigned_actions(self, mocked_autograph):
        a = ActionFactory(signed=False)
        call_command("update_action_signatures")
        a.refresh_from_db()
        assert a.signature is not None

    def test_it_signs_out_of_date_actions(self, settings, mocked_autograph):
        a = ActionFactory(signed=True)
        a.signature.timestamp -= timedelta(seconds=settings.AUTOGRAPH_SIGNATURE_MAX_AGE * 2)
        a.signature.signature = "old signature"
        a.signature.save()
        call_command("update_action_signatures")
        a.refresh_from_db()
        assert a.signature.signature is not "old signature"

    def test_it_resigns_signed_actions_with_force(self, mocked_autograph):
        a = ActionFactory(signed=True)
        a.signature.signature = "old signature"
        a.signature.save()
        call_command("update_action_signatures", "--force")
        a.refresh_from_db()
        assert a.signature.signature != "old signature"

    def test_it_does_not_resign_up_to_date_actions(self, settings, mocked_autograph):
        a = ActionFactory(signed=True)
        a.signature.signature = "original signature"
        a.signature.save()
        call_command("update_action_signatures")
        a.refresh_from_db()
        assert a.signature.signature == "original signature"


@pytest.mark.django_db
class TestUpdateAddonUrls(object):
    def test_it_works(self):
        action = ActionFactory(name="opt-out-study")
        recipe = RecipeFactory(
            action=action,
            arguments={"addonUrl": "https://before.example.com/extensions/addon.xpi"},
        )
        call_command("update_addon_urls", "after.example.com")

        # For reasons that I don't understand, recipe.update_from_db() doesn't work here.
        recipe = Recipe.objects.get(id=recipe.id)
        assert recipe.arguments["addonUrl"] == "https://after.example.com/extensions/addon.xpi"

    def test_signatures_are_updated(self, mocked_autograph):
        action = ActionFactory(name="opt-out-study")
        recipe = RecipeFactory(
            action=action,
            arguments={"addonUrl": "https://before.example.com/extensions/addon.xpi"},
            approver=UserFactory(),
            enabler=UserFactory(),
            signed=True,
        )
        # preconditions
        assert recipe.signature is not None
        assert recipe.signature.signature == hashlib.sha256(recipe.canonical_json()).hexdigest()
        signature_before = recipe.signature.signature

        call_command("update_addon_urls", "after.example.com")
        recipe.refresh_from_db()

        assert recipe.signature is not None
        assert recipe.signature != signature_before
        assert recipe.signature.signature == hashlib.sha256(recipe.canonical_json()).hexdigest()

    def test_new_hostname_is_required(self):
        with pytest.raises(CommandError) as err:
            call_command("update_addon_urls")
        assert "the following arguments are required: new_hostname" in str(err)

    def test_it_doesnt_update_other_actions(self):
        action = ActionFactory(name="some-other-action")
        recipe = RecipeFactory(
            action=action,
            arguments={"addonUrl": "https://before.example.com/extensions/addon.xpi"},
        )
        call_command("update_addon_urls", "after.example.com")
        # For reasons that I don't understand, recipe.update_from_db() doesn't work here.
        recipe = Recipe.objects.get(id=recipe.id)
        # Url should not be not updated
        assert recipe.arguments["addonUrl"] == "https://before.example.com/extensions/addon.xpi"
