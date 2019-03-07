import hashlib
import json
from unittest.mock import patch
from datetime import timedelta
import requests_mock

from django.conf import settings
from django.core.management import call_command, CommandError
from django.core.exceptions import ImproperlyConfigured

import pytest
import requests.exceptions

from normandy.base.tests import UserFactory
from normandy.recipes import exports
from normandy.recipes.models import Action, Recipe
from normandy.recipes.tests import ActionFactory, RecipeFactory
from normandy.studies.tests import ExtensionFactory


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
        assert r.signature.signature != "old signature"

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
        assert r.signature.signature != "old signature"

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
        assert a.signature.signature != "old signature"

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


addonUrl = "addonUrl"


@pytest.mark.django_db
class TestUpdateAddonUrls(object):
    def test_it_works(self, storage):
        extension = ExtensionFactory()
        fake_old_url = extension.xpi.url.replace("/media/", "/media-old/")
        action = ActionFactory(name="opt-out-study")
        recipe = RecipeFactory(action=action, arguments={addonUrl: fake_old_url})
        call_command("update_addon_urls")

        # For reasons that I don't understand, recipe.update_from_db() doesn't work here.
        recipe = Recipe.objects.get(id=recipe.id)
        assert recipe.arguments[addonUrl] == extension.xpi.url

    def test_signatures_are_updated(self, mocked_autograph, storage):
        extension = ExtensionFactory()
        fake_old_url = extension.xpi.url.replace("/media/", "/media-old/")
        action = ActionFactory(name="opt-out-study")
        recipe = RecipeFactory(
            action=action,
            arguments={addonUrl: fake_old_url},
            approver=UserFactory(),
            enabler=UserFactory(),
            signed=True,
        )
        # preconditions
        assert recipe.signature is not None
        assert recipe.signature.signature == hashlib.sha256(recipe.canonical_json()).hexdigest()
        signature_before = recipe.signature.signature

        call_command("update_addon_urls")
        recipe.refresh_from_db()

        assert recipe.signature is not None
        assert recipe.signature != signature_before
        assert recipe.signature.signature == hashlib.sha256(recipe.canonical_json()).hexdigest()

    def test_it_doesnt_update_other_actions(self):
        action = ActionFactory(name="some-other-action")
        recipe = RecipeFactory(
            action=action, arguments={addonUrl: "https://before.example.com/extensions/addon.xpi"}
        )
        call_command("update_addon_urls")
        # For reasons that I don't understand, recipe.update_from_db() doesn't work here.
        recipe = Recipe.objects.get(id=recipe.id)
        # Url should not be not updated
        assert recipe.arguments[addonUrl] == "https://before.example.com/extensions/addon.xpi"

    def test_it_works_for_multiple_extensions(self, storage):
        extension1 = ExtensionFactory(name="1.xpi")
        extension2 = ExtensionFactory(name="2.xpi")

        fake_old_url1 = extension1.xpi.url.replace("/media/", "/media-old/")
        fake_old_url2 = extension2.xpi.url.replace("/media/", "/media-old/")

        action = ActionFactory(name="opt-out-study")
        recipe1 = RecipeFactory(action=action, arguments={addonUrl: fake_old_url1})
        recipe2 = RecipeFactory(action=action, arguments={addonUrl: fake_old_url2})
        call_command("update_addon_urls")

        # For reasons that I don't understand, recipe.update_from_db() doesn't work here.
        recipe1 = Recipe.objects.get(id=recipe1.id)
        recipe2 = Recipe.objects.get(id=recipe2.id)

        assert recipe1.arguments[addonUrl] == extension1.xpi.url
        assert recipe2.arguments[addonUrl] == extension2.xpi.url


@pytest.mark.django_db
class TestSyncRemoteSettings(object):
    workspace_collection_url = (
        f"/v1/buckets/{settings.REMOTE_SETTINGS_BUCKET_ID}/collections"
        f"/{settings.REMOTE_SETTINGS_COLLECTION_ID}"
    )
    published_records_url = (
        f"/v1/buckets/{exports.RemoteSettings.MAIN_BUCKET_ID}/collections"
        f"/{settings.REMOTE_SETTINGS_COLLECTION_ID}/records"
    )

    @pytest.mark.django_db
    def test_it_works(self, rs_settings, requestsmock):
        """
        Verify that the sync_remote_settings command doesn't throw an error.
        """
        requestsmock.get(self.published_records_url, json={"data": []})

        call_command("sync_remote_settings")

    def test_it_fails_if_not_enabled(self):
        # We enabled Remote Settings without mocking server calls.
        with pytest.raises(ImproperlyConfigured):
            call_command("sync_remote_settings")

    def test_it_fails_if_server_not_reachable(self, rs_settings, requestsmock):
        requestsmock.get(self.published_records_url, exc=requests.exceptions.ConnectionError)

        with pytest.raises(requests.exceptions.ConnectionError):
            call_command("sync_remote_settings")

    def test_it_does_nothing_on_dry_run(self, rs_settings, requestsmock, mocked_remotesettings):
        r1 = RecipeFactory(name="Test 1", approver=UserFactory())
        r1 = RecipeFactory(name="Test 1", enabler=UserFactory(), approver=UserFactory())
        requestsmock.get(self.published_records_url, json={"data": [exports.recipe_as_record(r1)]})

        call_command("sync_remote_settings", "--dry-run")

        assert not mocked_remotesettings.publish.called
        assert not mocked_remotesettings.unpublish.called

    def test_publishes_missing_recipes(self, rs_settings, requestsmock):
        # Some records will be created with PUT.
        requestsmock.put(requests_mock.ANY, json={})
        # A signature request will be sent.
        requestsmock.patch(self.workspace_collection_url, json={})
        # Instantiate local recipes.
        r1 = RecipeFactory(name="Test 1", enabler=UserFactory(), approver=UserFactory())
        r2 = RecipeFactory(name="Test 2", enabler=UserFactory(), approver=UserFactory())
        # Mock the server responses.
        # `r2` should be on the server
        requestsmock.get(self.published_records_url, json={"data": [exports.recipe_as_record(r1)]})
        # It will be created.
        r2_url = self.workspace_collection_url + f"/records/{r2.id}"
        requestsmock.put(r2_url, json={})

        call_command("sync_remote_settings")

        assert requestsmock.request_history[-2].method == "PUT"
        assert requestsmock.request_history[-2].url.endswith(r2_url)

    def test_republishes_outdated_recipes(self, rs_settings, requestsmock):
        # Some records will be created with PUT.
        requestsmock.put(requests_mock.ANY, json={})
        # A signature request will be sent.
        requestsmock.patch(self.workspace_collection_url, json={})
        # Instantiate local recipes.
        r1 = RecipeFactory(name="Test 1", enabler=UserFactory(), approver=UserFactory())
        r2 = RecipeFactory(name="Test 2", enabler=UserFactory(), approver=UserFactory())
        # Mock the server responses.
        to_update = {**exports.recipe_as_record(r2), "name": "Outdated name"}
        requestsmock.get(
            self.published_records_url, json={"data": [exports.recipe_as_record(r1), to_update]}
        )
        # It will be updated.
        r2_url = self.workspace_collection_url + f"/records/{r2.id}"
        requestsmock.put(r2_url, json={})

        call_command("sync_remote_settings")

        assert requestsmock.request_history[-2].method == "PUT"
        assert requestsmock.request_history[-2].url.endswith(r2_url)

    def test_unpublishes_extra_recipes(self, rs_settings, requestsmock):
        # Some records will be created with PUT.
        requestsmock.put(requests_mock.ANY, json={})
        # A signature request will be sent.
        requestsmock.patch(self.workspace_collection_url, json={})
        # Instantiate local recipes.
        r1 = RecipeFactory(name="Test 1", enabler=UserFactory(), approver=UserFactory())
        r2 = RecipeFactory(name="Test 2", approver=UserFactory())
        # Mock the server responses.
        # `r2` should not be on the server (not enabled)
        requestsmock.get(
            self.published_records_url,
            json={"data": [exports.recipe_as_record(r1), exports.recipe_as_record(r2)]},
        )
        # It will be deleted.
        r2_url = self.workspace_collection_url + f"/records/{r2.id}"
        requestsmock.delete(r2_url, json={"data": {}})

        call_command("sync_remote_settings")

        assert requestsmock.request_history[-2].method == "DELETE"
        assert requestsmock.request_history[-2].url.endswith(r2_url)
