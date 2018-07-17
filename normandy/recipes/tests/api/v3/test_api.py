from datetime import datetime, timedelta

from django.db import connection
from django.test.utils import CaptureQueriesContext

import pytest
from rest_framework import serializers
from rest_framework.reverse import reverse

from normandy.base.api.permissions import AdminEnabledOrReadOnly
from normandy.base.tests import UserFactory, Whatever
from normandy.base.utils import canonical_json_dumps
from normandy.recipes.models import ApprovalRequest, Recipe
from normandy.recipes.tests import (
    ActionFactory,
    ApprovalRequestFactory,
    ChannelFactory,
    CountryFactory,
    LocaleFactory,
    RecipeFactory,
    RecipeRevisionFactory,
    fake_sign,
)


@pytest.mark.django_db
class TestActionAPI(object):
    def test_it_works(self, api_client):
        res = api_client.get("/api/v3/action/")
        assert res.status_code == 200
        assert res.data == []

    def test_it_serves_actions(self, api_client):
        action = ActionFactory(
            name="foo", implementation="foobar", arguments_schema={"type": "object"}
        )

        res = api_client.get("/api/v3/action/")
        action_url = reverse(
            "recipes:action-implementation",
            kwargs={"name": action.name, "impl_hash": action.implementation_hash},
        )
        assert res.status_code == 200
        assert res.data == [
            {
                "id": action.id,
                "name": "foo",
                "implementation_url": Whatever.endswith(action_url),
                "arguments_schema": {"type": "object"},
            }
        ]

    def test_it_serves_actions_without_implementation(self, api_client):
        action = ActionFactory(
            name="foo-remote", implementation=None, arguments_schema={"type": "object"}
        )

        res = api_client.get("/api/v3/action/")
        assert res.status_code == 200
        assert res.data == [
            {
                "id": action.id,
                "name": "foo-remote",
                "implementation_url": None,
                "arguments_schema": {"type": "object"},
            }
        ]

    def test_list_view_includes_cache_headers(self, api_client):
        res = api_client.get("/api/v3/action/")
        assert res.status_code == 200
        # It isn't important to assert a particular value for max-age
        assert "max-age=" in res["Cache-Control"]
        assert "public" in res["Cache-Control"]

    def test_detail_view_includes_cache_headers(self, api_client):
        action = ActionFactory()
        res = api_client.get("/api/v3/action/{id}/".format(id=action.id))
        assert res.status_code == 200
        # It isn't important to assert a particular value for max-age
        assert "max-age=" in res["Cache-Control"]
        assert "public" in res["Cache-Control"]

    def test_list_sets_no_cookies(self, api_client):
        res = api_client.get("/api/v3/action/")
        assert res.status_code == 200
        assert "Cookies" not in res

    def test_detail_sets_no_cookies(self, api_client):
        action = ActionFactory()
        res = api_client.get("/api/v3/action/{id}/".format(id=action.id))
        assert res.status_code == 200
        assert res.client.cookies == {}


@pytest.mark.django_db
class TestRecipeAPI(object):
    @pytest.mark.django_db
    class TestListing(object):
        def test_it_works(self, api_client):
            res = api_client.get("/api/v3/recipe/")
            assert res.status_code == 200
            assert res.data["results"] == []

        def test_it_serves_recipes(self, api_client):
            recipe = RecipeFactory()

            res = api_client.get("/api/v3/recipe/")
            assert res.status_code == 200
            assert res.data["results"][0]["name"] == recipe.name

        def test_available_if_admin_enabled(self, api_client, settings):
            settings.ADMIN_ENABLED = True
            res = api_client.get("/api/v3/recipe/")
            assert res.status_code == 200
            assert res.data["results"] == []

        def test_readonly_if_admin_disabled(self, api_client, settings):
            settings.ADMIN_ENABLED = False
            res = api_client.get("/api/v3/recipe/")
            assert res.status_code == 200

            recipe = RecipeFactory(name="unchanged")
            res = api_client.patch("/api/v3/recipe/%s/" % recipe.id, {"name": "changed"})
            assert res.status_code == 403
            assert res.data["detail"] == AdminEnabledOrReadOnly.message

        def test_list_view_includes_cache_headers(self, api_client):
            res = api_client.get("/api/v3/recipe/")
            assert res.status_code == 200
            # It isn't important to assert a particular value for max_age
            assert "max-age=" in res["Cache-Control"]
            assert "public" in res["Cache-Control"]

        def test_list_sets_no_cookies(self, api_client):
            res = api_client.get("/api/v3/recipe/")
            assert res.status_code == 200
            assert "Cookies" not in res

    @pytest.mark.django_db
    class TestCreation(object):
        def test_it_can_create_recipes(self, api_client):
            action = ActionFactory()

            # Enabled recipe
            res = api_client.post(
                "/api/v3/recipe/",
                {
                    "name": "Test Recipe",
                    "action_id": action.id,
                    "arguments": {},
                    "extra_filter_expression": "whatever",
                    "enabled": True,
                },
            )
            assert res.status_code == 201, res.json()

            recipes = Recipe.objects.all()
            assert recipes.count() == 1

        def test_it_can_create_recipes_actions_without_implementation(self, api_client):
            action = ActionFactory(implementation=None)
            assert action.implementation is None

            # Enabled recipe
            res = api_client.post(
                "/api/v3/recipe/",
                {
                    "name": "Test Recipe",
                    "action_id": action.id,
                    "arguments": {},
                    "extra_filter_expression": "whatever",
                    "enabled": True,
                },
            )
            assert res.status_code == 201

            recipe, = Recipe.objects.all()
            assert recipe.action.implementation is None

        def test_it_can_create_disabled_recipes(self, api_client):
            action = ActionFactory()

            # Disabled recipe
            res = api_client.post(
                "/api/v3/recipe/",
                {
                    "name": "Test Recipe",
                    "action_id": action.id,
                    "arguments": {},
                    "extra_filter_expression": "whatever",
                    "enabled": False,
                },
            )
            assert res.status_code == 201

            recipes = Recipe.objects.all()
            assert recipes.count() == 1

        def test_creation_when_action_does_not_exist(self, api_client):
            res = api_client.post(
                "/api/v3/recipe/", {"name": "Test Recipe", "action_id": 1234, "arguments": {}}
            )
            assert res.status_code == 400
            assert res.json()["action_id"] == [
                serializers.PrimaryKeyRelatedField.default_error_messages["does_not_exist"].format(
                    pk_value=1234
                )
            ]

            recipes = Recipe.objects.all()
            assert recipes.count() == 0

        def test_creation_when_action_id_is_missing(self, api_client):
            res = api_client.post("/api/v3/recipe/", {"name": "Test Recipe", "arguments": {}})
            assert res.status_code == 400
            assert res.json()["action_id"] == [
                serializers.PrimaryKeyRelatedField.default_error_messages["required"]
            ]

            recipes = Recipe.objects.all()
            assert recipes.count() == 0

        def test_creation_when_action_id_is_invalid(self, api_client):
            res = api_client.post(
                "/api/v3/recipe/",
                {"name": "Test Recipe", "action_id": "a string", "arguments": {}},
            )
            assert res.status_code == 400
            assert res.json()["action_id"] == [
                serializers.PrimaryKeyRelatedField.default_error_messages["incorrect_type"].format(
                    data_type="str"
                )
            ]

            recipes = Recipe.objects.all()
            assert recipes.count() == 0

        def test_creation_when_arguments_are_invalid(self, api_client):
            action = ActionFactory(
                name="foobarbaz",
                arguments_schema={
                    "type": "object",
                    "properties": {"message": {"type": "string"}},
                    "required": ["message"],
                },
            )
            res = api_client.post(
                "/api/v3/recipe/",
                {
                    "name": "Test Recipe",
                    "enabled": True,
                    "extra_filter_expression": "true",
                    "action_id": action.id,
                    "arguments": {"message": ""},
                },
            )
            assert res.status_code == 400
            assert res.json()["arguments"]["message"] == (
                serializers.CharField.default_error_messages["blank"]
            )

            recipes = Recipe.objects.all()
            assert recipes.count() == 0

        def test_creation_when_arguments_is_a_string(self, api_client):
            action = ActionFactory(
                name="foobarbaz",
                arguments_schema={
                    "type": "object",
                    "properties": {"message": {"type": "string"}},
                    "required": ["message"],
                },
            )
            data = {
                "name": "Test Recipe",
                "enabled": True,
                "extra_filter_expression": "true",
                "action_id": action.id,
                "arguments": '{"message": "the message"}',
            }
            res = api_client.post("/api/v3/recipe/", data)
            assert res.status_code == 400
            assert res.data == {"arguments": ["Must be an object."]}

            recipes = Recipe.objects.all()
            assert recipes.count() == 0

        def test_creation_when_action_id_is_a_string_and_arguments_are_invalid(self, api_client):
            action = ActionFactory(
                name="foobarbaz",
                arguments_schema={
                    "type": "object",
                    "properties": {"message": {"type": "string"}},
                    "required": ["message"],
                },
            )
            data = {
                "name": "Test Recipe",
                "enabled": True,
                "extra_filter_expression": "true",
                "action_id": f"{action.id}",
                "arguments": {},
            }
            res = api_client.post("/api/v3/recipe/", data)
            assert res.status_code == 400
            assert res.data == {"arguments": {"message": "This field may not be blank."}}

            recipes = Recipe.objects.all()
            assert recipes.count() == 0

        def test_creation_when_identicon_seed_is_invalid(self, api_client):
            action = ActionFactory()

            res = api_client.post(
                "/api/v3/recipe/",
                {
                    "name": "Test Recipe",
                    "action_id": action.id,
                    "arguments": {},
                    "extra_filter_expression": "whatever",
                    "enabled": True,
                    "identicon_seed": "invalid_identicon_seed",
                },
            )
            assert res.status_code == 400

        def test_at_least_one_filter_is_required(self, api_client):
            action = ActionFactory()

            res = api_client.post(
                "/api/v3/recipe/",
                {"name": "Test Recipe", "action_id": action.id, "arguments": {}, "enabled": True},
            )
            assert res.status_code == 400, res.json()
            assert res.json() == {
                "non_field_errors": ["one of extra_filter_expression or filter_object is required"]
            }

        def test_with_bug_number(self, api_client):
            action = ActionFactory()

            res = api_client.post(
                "/api/v3/recipe/",
                {
                    "name": "Test Recipe",
                    "action_id": action.id,
                    "arguments": {},
                    "extra_filter_expression": "whatever",
                    "enabled": True,
                    "bug_number": 42,
                },
            )
            assert res.status_code == 201, res.json()

            recipe = Recipe.objects.get()
            assert recipe.bug_number == 42

    @pytest.mark.django_db
    class TestUpdates(object):
        def test_it_can_edit_recipes(self, api_client):
            recipe = RecipeFactory(name="unchanged", extra_filter_expression="true")
            old_revision_id = recipe.revision_id

            res = api_client.patch(
                "/api/v3/recipe/%s/" % recipe.id,
                {"name": "changed", "extra_filter_expression": "false"},
            )
            assert res.status_code == 200

            recipe = Recipe.objects.all()[0]
            assert recipe.name == "changed"
            assert recipe.filter_expression == "false"
            assert recipe.revision_id != old_revision_id

        def test_it_can_change_action_for_recipes(self, api_client):
            recipe = RecipeFactory()
            action = ActionFactory()

            res = api_client.patch("/api/v3/recipe/%s/" % recipe.id, {"action_id": action.id})
            assert res.status_code == 200

            recipe = Recipe.objects.get(pk=recipe.id)
            assert recipe.action == action

        def test_it_can_change_arguments_for_recipes(self, api_client):
            recipe = RecipeFactory(arguments_json="{}")
            action = ActionFactory(
                name="foobarbaz",
                arguments_schema={
                    "type": "object",
                    "properties": {"message": {"type": "string"}, "checkbox": {"type": "boolean"}},
                    "required": ["message", "checkbox"],
                },
            )

            arguments = {"message": "test message", "checkbox": False}

            res = api_client.patch(
                "/api/v3/recipe/%s/" % recipe.id, {"action_id": action.id, "arguments": arguments}
            )
            assert res.status_code == 200, res.json()
            recipe.refresh_from_db()
            assert recipe.arguments == arguments

            res = api_client.get("/api/v3/recipe/%s/" % recipe.id)
            assert res.status_code == 200, res.json()
            assert res.json()["arguments"] == arguments

            arguments = {"message": "second message", "checkbox": True}
            res = api_client.patch(
                "/api/v3/recipe/%s/" % recipe.id, {"action_id": action.id, "arguments": arguments}
            )
            assert res.status_code == 200, res.json()
            recipe.refresh_from_db()
            assert recipe.arguments == arguments

            res = api_client.get("/api/v3/recipe/%s/" % recipe.id)
            assert res.status_code == 200, res.json()
            assert res.json()["arguments"] == arguments

        def test_it_can_delete_recipes(self, api_client):
            recipe = RecipeFactory()

            res = api_client.delete("/api/v3/recipe/%s/" % recipe.id)
            assert res.status_code == 204

            recipes = Recipe.objects.all()
            assert recipes.count() == 0

        def test_update_recipe_action(self, api_client):
            r = RecipeFactory()
            a = ActionFactory(name="test")

            res = api_client.patch(f"/api/v3/recipe/{r.pk}/", {"action_id": a.id})
            assert res.status_code == 200

            r.refresh_from_db()
            assert r.action == a

        def test_update_recipe_locale(self, api_client):
            l1 = LocaleFactory(code="fr-FR")
            l2 = LocaleFactory(code="en-US")
            r = RecipeFactory(locales=[l1])

            res = api_client.patch(f"/api/v3/recipe/{r.pk}/", {"locales": ["en-US"]})
            assert res.status_code == 200

            r.refresh_from_db()
            assert list(r.locales.all()) == [l2]

        def test_update_recipe_country(self, api_client):
            c1 = CountryFactory(code="US")
            c2 = CountryFactory(code="CA")
            r = RecipeFactory(countries=[c1])

            res = api_client.patch(f"/api/v3/recipe/{r.pk}/", {"countries": ["CA"]})
            assert res.status_code == 200

            r.refresh_from_db()
            assert list(r.countries.all()) == [c2]

        def test_update_recipe_channel(self, api_client):
            c1 = ChannelFactory(slug="release")
            c2 = ChannelFactory(slug="beta")
            r = RecipeFactory(channels=[c1])

            res = api_client.patch(f"/api/v3/recipe/{r.pk}/", {"channels": ["beta"]})
            assert res.status_code == 200

            r.refresh_from_db()
            assert list(r.channels.all()) == [c2]

        def test_update_recipe_comment(self, api_client):
            r = RecipeFactory(comment="foo")

            res = api_client.patch(f"/api/v3/recipe/{r.pk}/", {"comment": "bar"})
            assert res.status_code == 200

            r.refresh_from_db()
            assert r.comment == "bar"

        def test_update_recipe_bug(self, api_client):
            r = RecipeFactory()

            res = api_client.patch(f"/api/v3/recipe/{r.pk}/", {"bug_number": 42})
            assert res.status_code == 200

            r.refresh_from_db()
            assert r.bug_number == 42

    @pytest.mark.django_db
    class TestFilterObjects(object):
        def make_recipe(self, api_client, **kwargs):
            data = {
                "name": "Test Recipe",
                "action_id": ActionFactory().id,
                "arguments": {},
                "enabled": True,
                "extra_filter_expression": "true",
                "filter_object": [],
            }
            data.update(kwargs)
            return api_client.post("/api/v3/recipe/", data)

        def test_bad_filter_objects(self, api_client):
            res = self.make_recipe(api_client, filter_object={})  # not a list
            assert res.status_code == 400
            assert res.json() == {
                "filter_object": {"non field errors": ["filter_object must be a list."]}
            }

            res = self.make_recipe(
                api_client, filter_object=["1 + 1 == 2"]
            )  # not a list of objects
            assert res.status_code == 400
            assert res.json() == {
                "filter_object": {
                    "0": {"non field errors": ["filter_object members must be objects."]}
                }
            }

            res = self.make_recipe(
                api_client, filter_object=[{"channels": ["release"]}]
            )  # type is required
            assert res.status_code == 400
            assert res.json() == {"filter_object": {"0": {"type": ["This field is required."]}}}

        def test_channel_works(self, api_client):
            res = self.make_recipe(
                api_client, filter_object=[{"type": "channel", "channels": ["release", "beta"]}]
            )
            assert res.status_code == 201, res.json()
            recipe_data = res.json()

            Recipe.objects.get(id=recipe_data["id"])
            assert recipe_data["filter_expression"] == (
                '(normandy.channel in ["release","beta"]) && (true)'
            )

        def test_channel_correct_fields(self, api_client):
            res = self.make_recipe(api_client, filter_object=[{"type": "channel"}])
            assert res.status_code == 400
            assert res.json() == {
                "filter_object": {"0": {"channels": ["This field is required."]}}
            }

        def test_locale_works(self, api_client):
            res = self.make_recipe(
                api_client, filter_object=[{"type": "locale", "locales": ["en-US", "de"]}]
            )
            assert res.status_code == 201, res.json()
            recipe_data = res.json()

            Recipe.objects.get(id=recipe_data["id"])
            assert recipe_data["filter_expression"] == (
                '(normandy.locale in ["en-US","de"]) && (true)'
            )

        def test_locale_correct_fields(self, api_client):
            res = self.make_recipe(api_client, filter_object=[{"type": "locale"}])
            assert res.status_code == 400
            assert res.json() == {"filter_object": {"0": {"locales": ["This field is required."]}}}

        def test_country_works(self, api_client):
            res = self.make_recipe(
                api_client, filter_object=[{"type": "country", "countries": ["US", "DE"]}]
            )
            assert res.status_code == 201, res.json()
            recipe_data = res.json()

            Recipe.objects.get(id=recipe_data["id"])
            assert recipe_data["filter_expression"] == (
                '(normandy.country in ["US","DE"]) && (true)'
            )

        def test_country_correct_fields(self, api_client):
            res = self.make_recipe(api_client, filter_object=[{"type": "country"}])
            assert res.status_code == 400
            assert res.json() == {
                "filter_object": {"0": {"countries": ["This field is required."]}}
            }

        def test_bucket_sample_works(self, api_client):
            res = self.make_recipe(
                api_client,
                filter_object=[
                    {
                        "type": "bucketSample",
                        "start": 1,
                        "count": 2,
                        "total": 3,
                        "input": ["normandy.userId", "normandy.recipeId"],
                    }
                ],
            )
            assert res.status_code == 201, res.json()
            recipe_data = res.json()

            Recipe.objects.get(id=recipe_data["id"])
            assert recipe_data["filter_expression"] == (
                "([normandy.userId,normandy.recipeId]|bucketSample(1.0,2.0,3.0)) && (true)"
            )

        def test_bucket_sample_correct_fields(self, api_client):
            res = self.make_recipe(api_client, filter_object=[{"type": "bucketSample"}])
            assert res.status_code == 400
            assert res.json() == {
                "filter_object": {
                    "0": {
                        "start": ["This field is required."],
                        "count": ["This field is required."],
                        "total": ["This field is required."],
                        "input": ["This field is required."],
                    }
                }
            }

            res = self.make_recipe(
                api_client,
                filter_object=[{"type": "bucketSample", "start": "a", "count": -1, "total": -2}],
            )
            assert res.status_code == 400
            assert res.json() == {
                "filter_object": {
                    "0": {
                        "start": ["A valid number is required."],
                        "count": ["Ensure this value is greater than or equal to 0."],
                        "total": ["Ensure this value is greater than or equal to 0."],
                        "input": ["This field is required."],
                    }
                }
            }

        def test_stable_sample_works(self, api_client):
            res = self.make_recipe(
                api_client,
                filter_object=[
                    {
                        "type": "stableSample",
                        "rate": 0.5,
                        "input": ["normandy.userId", "normandy.recipeId"],
                    }
                ],
            )
            assert res.status_code == 201, res.json()
            recipe_data = res.json()

            Recipe.objects.get(id=recipe_data["id"])
            assert recipe_data["filter_expression"] == (
                "([normandy.userId,normandy.recipeId]|stableSample(0.5)) && (true)"
            )

        def test_stable_sample_correct_fields(self, api_client):
            res = self.make_recipe(api_client, filter_object=[{"type": "stableSample"}])
            assert res.status_code == 400
            assert res.json() == {
                "filter_object": {
                    "0": {
                        "rate": ["This field is required."],
                        "input": ["This field is required."],
                    }
                }
            }

            res = self.make_recipe(
                api_client, filter_object=[{"type": "stableSample", "rate": 10}]
            )
            assert res.status_code == 400
            assert res.json() == {
                "filter_object": {
                    "0": {
                        "rate": ["Ensure this value is less than or equal to 1."],
                        "input": ["This field is required."],
                    }
                }
            }

        def test_version_works(self, api_client):
            res = self.make_recipe(
                api_client, filter_object=[{"type": "version", "versions": [57, 58]}]
            )
            assert res.status_code == 201, res.json()
            recipe_data = res.json()

            Recipe.objects.get(id=recipe_data["id"])
            assert recipe_data["filter_expression"] == (
                '((normandy.version>="57"&&normandy.version<"58")||'
                '(normandy.version>="58"&&normandy.version<"59")) && (true)'
            )

        def test_version_correct_fields(self, api_client):
            res = self.make_recipe(api_client, filter_object=[{"type": "version"}])
            assert res.status_code == 400
            assert res.json() == {
                "filter_object": {"0": {"versions": ["This field is required."]}}
            }

        def test_invalid_filter(self, api_client):
            res = self.make_recipe(api_client, filter_object=[{"type": "invalid"}])
            assert res.status_code == 400
            assert res.json() == {
                "filter_object": {"0": {"type": ['Unknown filter object type "invalid".']}}
            }

    @pytest.mark.django_db
    class TestDetail(object):
        def test_history(self, api_client):
            recipe = RecipeFactory(name="version 1")
            recipe.revise(name="version 2")
            recipe.revise(name="version 3")

            res = api_client.get("/api/v3/recipe/%s/history/" % recipe.id)

            assert res.data[0]["recipe"]["name"] == "version 3"
            assert res.data[1]["recipe"]["name"] == "version 2"
            assert res.data[2]["recipe"]["name"] == "version 1"

        def test_it_can_enable_recipes(self, api_client):
            recipe = RecipeFactory(approver=UserFactory())

            res = api_client.post("/api/v3/recipe/%s/enable/" % recipe.id)
            assert res.status_code == 200
            assert res.data["enabled"] is True

            recipe = Recipe.objects.all()[0]
            assert recipe.enabled

        def test_cannot_enable_unapproved_recipes(self, api_client):
            recipe = RecipeFactory()

            res = api_client.post("/api/v3/recipe/%s/enable/" % recipe.id)
            assert res.status_code == 409
            assert res.data["error"] == "Cannot enable a recipe that is not approved."

        def test_cannot_enable_enabled_recipes(self, api_client):
            recipe = RecipeFactory(approver=UserFactory(), enabler=UserFactory())

            res = api_client.post("/api/v3/recipe/%s/enable/" % recipe.id)
            assert res.status_code == 409
            assert res.data["error"] == "This revision is already enabled."

        def test_it_can_disable_recipes(self, api_client):
            recipe = RecipeFactory(approver=UserFactory())

            res = api_client.post("/api/v3/recipe/%s/disable/" % recipe.id)
            assert res.status_code == 200
            assert res.data["enabled"] is False

            recipe = Recipe.objects.all()[0]
            assert not recipe.enabled

        def test_detail_view_includes_cache_headers(self, api_client):
            recipe = RecipeFactory()
            res = api_client.get(f"/api/v3/recipe/{recipe.id}/")
            assert res.status_code == 200
            # It isn't important to assert a particular value for max-age
            assert "max-age=" in res["Cache-Control"]
            assert "public" in res["Cache-Control"]

        def test_detail_sets_no_cookies(self, api_client):
            recipe = RecipeFactory()
            res = api_client.get("/api/v3/recipe/{id}/".format(id=recipe.id))
            assert res.status_code == 200
            assert res.client.cookies == {}

    @pytest.mark.django_db
    class TestFiltering(object):
        def test_filtering_by_enabled_lowercase(self, api_client):
            r1 = RecipeFactory(approver=UserFactory(), enabler=UserFactory())
            RecipeFactory()

            res = api_client.get("/api/v3/recipe/?enabled=true")
            assert res.status_code == 200
            assert [r["id"] for r in res.data["results"]] == [r1.id]

        def test_filtering_by_enabled_fuzz(self, api_client):
            """
            Test that we don't return 500 responses when we get unexpected boolean filters.

            This was a real case that showed up in our error logging.
            """
            url = (
                "/api/v3/recipe/?enabled=javascript%3a%2f*"
                "<%2fscript><svg%2fonload%3d'%2b%2f'%2f%2b"
            )
            res = api_client.get(url)
            assert res.status_code == 200

        def test_list_filter_status(self, api_client):
            r1 = RecipeFactory()
            r2 = RecipeFactory(approver=UserFactory(), enabler=UserFactory())

            res = api_client.get("/api/v3/recipe/?status=enabled")
            assert res.status_code == 200
            results = res.data["results"]
            assert len(results) == 1
            assert results[0]["id"] == r2.id

            res = api_client.get("/api/v3/recipe/?status=disabled")
            assert res.status_code == 200
            results = res.data["results"]
            assert len(results) == 1
            assert results[0]["id"] == r1.id

        def test_list_filter_channels(self, api_client):
            r1 = RecipeFactory(channels=[ChannelFactory(slug="beta")])
            r2 = RecipeFactory(channels=[ChannelFactory(slug="release")])

            res = api_client.get("/api/v3/recipe/?channels=beta")
            assert res.status_code == 200
            results = res.data["results"]
            assert len(results) == 1
            assert results[0]["id"] == r1.id

            res = api_client.get("/api/v3/recipe/?channels=beta,release")
            assert res.status_code == 200
            results = res.data["results"]
            assert len(results) == 2
            for recipe in results:
                assert recipe["id"] in [r1.id, r2.id]

        def test_list_filter_countries(self, api_client):
            r1 = RecipeFactory(countries=[CountryFactory(code="US")])
            r2 = RecipeFactory(countries=[CountryFactory(code="CA")])

            res = api_client.get("/api/v3/recipe/?countries=US")
            assert res.status_code == 200
            results = res.data["results"]
            assert len(results) == 1
            assert results[0]["id"] == r1.id

            res = api_client.get("/api/v3/recipe/?countries=US,CA")
            assert res.status_code == 200
            results = res.data["results"]
            assert len(results) == 2
            for recipe in results:
                assert recipe["id"] in [r1.id, r2.id]

        def test_list_filter_locales(self, api_client):
            r1 = RecipeFactory(locales=[LocaleFactory(code="en-US")])
            r2 = RecipeFactory(locales=[LocaleFactory(code="fr-CA")])

            res = api_client.get("/api/v3/recipe/?locales=en-US")
            assert res.status_code == 200
            results = res.data["results"]
            assert len(results) == 1
            assert results[0]["id"] == r1.id

            res = api_client.get("/api/v3/recipe/?locales=en-US,fr-CA")
            assert res.status_code == 200
            results = res.data["results"]
            assert len(results) == 2
            for recipe in results:
                assert recipe["id"] in [r1.id, r2.id]

        def test_list_filter_text(self, api_client):
            r1 = RecipeFactory(name="first", extra_filter_expression="1 + 1 == 2")
            r2 = RecipeFactory(name="second", extra_filter_expression="one + one == two")

            res = api_client.get("/api/v3/recipe/?text=first")
            assert res.status_code == 200
            results = res.data["results"]
            assert len(results) == 1
            assert results[0]["id"] == r1.id

            res = api_client.get("/api/v3/recipe/?text=one")
            assert res.status_code == 200
            results = res.data["results"]
            assert len(results) == 1
            assert results[0]["id"] == r2.id

            res = api_client.get("/api/v3/recipe/?text=t")
            assert res.status_code == 200
            results = res.data["results"]
            assert len(results) == 2
            for recipe in results:
                assert recipe["id"] in [r1.id, r2.id]

        def test_search_works_with_arguments(self, api_client):
            r1 = RecipeFactory(arguments={"one": 1})
            r2 = RecipeFactory(arguments={"two": 2})

            res = api_client.get("/api/v3/recipe/?text=one")
            assert res.status_code == 200
            assert [r["id"] for r in res.data["results"]] == [r1.id]

            res = api_client.get("/api/v3/recipe/?text=2")
            assert res.status_code == 200
            assert [r["id"] for r in res.data["results"]] == [r2.id]

        def test_search_out_of_order(self, api_client):
            r1 = RecipeFactory(name="apple banana")
            r2 = RecipeFactory(name="cherry daikon")

            res = api_client.get("/api/v3/recipe/?text=banana apple")
            assert res.status_code == 200
            assert [r["id"] for r in res.data["results"]] == [r1.id]

            res = api_client.get("/api/v3/recipe/?text=daikon cherry")
            assert res.status_code == 200
            assert [r["id"] for r in res.data["results"]] == [r2.id]

        def test_list_filter_action_legacy(self, api_client):
            a1 = ActionFactory()
            a2 = ActionFactory()
            r1 = RecipeFactory(action=a1)
            r2 = RecipeFactory(action=a2)

            assert a1.id != a2.id

            res = api_client.get(f"/api/v3/recipe/?latest_revision__action={a1.id}")
            assert res.status_code == 200
            assert [r["id"] for r in res.data["results"]] == [r1.id]

            res = api_client.get(f"/api/v3/recipe/?latest_revision__action={a2.id}")
            assert res.status_code == 200
            assert [r["id"] for r in res.data["results"]] == [r2.id]

            assert a1.id != -1 and a2.id != -1
            res = api_client.get("/api/v3/recipe/?latest_revision__action=-1")
            assert res.status_code == 400
            assert res.data["latest_revision__action"][0].code == "invalid_choice"

        def test_list_filter_action(self, api_client):
            a1 = ActionFactory()
            a2 = ActionFactory()
            r1 = RecipeFactory(action=a1)
            r2 = RecipeFactory(action=a2)

            assert a1.name != a2.name

            res = api_client.get(f"/api/v3/recipe/?action={a1.name}")
            assert res.status_code == 200
            assert [r["id"] for r in res.data["results"]] == [r1.id]

            res = api_client.get(f"/api/v3/recipe/?action={a2.name}")
            assert res.status_code == 200
            assert [r["id"] for r in res.data["results"]] == [r2.id]

            assert a1.name != "nonexistant" and a2.name != "nonexistant"
            res = api_client.get("/api/v3/recipe/?action=nonexistant")
            assert res.status_code == 200
            assert res.data["count"] == 0

        def test_filter_by_bug_number(self, api_client):
            RecipeFactory()
            match1 = RecipeFactory(bug_number=1)
            match2 = RecipeFactory(bug_number=1)
            RecipeFactory(bug_number=2)

            res = api_client.get("/api/v3/recipe/?bug_number=1")
            assert res.status_code == 200
            assert res.data["count"] == 2
            assert set(r["id"] for r in res.data["results"]) == set([match1.id, match2.id])

        def test_order_last_updated(self, api_client):
            now = datetime.now()
            yesterday = now - timedelta(days=1)
            r1 = RecipeFactory(updated=yesterday)
            r2 = RecipeFactory(updated=now)

            res = api_client.get("/api/v3/recipe/?ordering=last_updated")
            assert res.status_code == 200
            assert [r["id"] for r in res.data["results"]] == [r1.id, r2.id]

            res = api_client.get("/api/v3/recipe/?ordering=-last_updated")
            assert res.status_code == 200
            assert [r["id"] for r in res.data["results"]] == [r2.id, r1.id]

        def test_order_name(self, api_client):
            r1 = RecipeFactory(name="a")
            r2 = RecipeFactory(name="b")

            res = api_client.get("/api/v3/recipe/?ordering=name")
            assert res.status_code == 200
            assert [r["id"] for r in res.data["results"]] == [r1.id, r2.id]

            res = api_client.get("/api/v3/recipe/?ordering=-name")
            assert res.status_code == 200
            assert [r["id"] for r in res.data["results"]] == [r2.id, r1.id]

        def test_order_bogus(self, api_client):
            """Test that filtering by an unknown key doesn't change the sort order"""
            RecipeFactory(name="a")
            RecipeFactory(name="b")

            res = api_client.get("/api/v3/recipe/?ordering=bogus")
            assert res.status_code == 200
            first_ordering = [r["id"] for r in res.data["results"]]

            res = api_client.get("/api/v3/recipe/?ordering=-bogus")
            assert res.status_code == 200
            assert [r["id"] for r in res.data["results"]] == first_ordering


@pytest.mark.django_db
class TestRecipeRevisionAPI(object):
    def test_it_works(self, api_client):
        res = api_client.get("/api/v3/recipe_revision/")
        assert res.status_code == 200
        assert res.data == []

    def test_it_serves_revisions(self, api_client):
        recipe = RecipeFactory()
        res = api_client.get("/api/v3/recipe_revision/%s/" % recipe.latest_revision.id)
        assert res.status_code == 200
        assert res.data["id"] == recipe.latest_revision.id

    def test_request_approval(self, api_client):
        recipe = RecipeFactory()
        res = api_client.post(
            "/api/v3/recipe_revision/{}/request_approval/".format(recipe.latest_revision.id)
        )
        assert res.status_code == 201
        assert res.data["id"] == recipe.latest_revision.approval_request.id

    def test_cannot_open_second_approval_request(self, api_client):
        recipe = RecipeFactory()
        ApprovalRequestFactory(revision=recipe.latest_revision)
        res = api_client.post(
            "/api/v3/recipe_revision/{}/request_approval/".format(recipe.latest_revision.id)
        )
        assert res.status_code == 400

    def test_it_has_an_identicon_seed(self, api_client):
        recipe = RecipeFactory(enabler=UserFactory(), approver=UserFactory())
        res = api_client.get(f"/api/v3/recipe_revision/{recipe.latest_revision.id}/")
        assert res.data["identicon_seed"] == recipe.identicon_seed


@pytest.mark.django_db
class TestApprovalRequestAPI(object):
    def test_it_works(self, api_client):
        res = api_client.get("/api/v3/approval_request/")
        assert res.status_code == 200
        assert res.data == []

    def test_approve(self, api_client):
        r = RecipeFactory()
        a = ApprovalRequestFactory(revision=r.latest_revision)
        res = api_client.post(
            "/api/v3/approval_request/{}/approve/".format(a.id), {"comment": "r+"}
        )
        assert res.status_code == 200

        r.refresh_from_db()
        assert r.is_approved
        assert r.approved_revision.approval_request.comment == "r+"

    def test_approve_no_comment(self, api_client):
        r = RecipeFactory()
        a = ApprovalRequestFactory(revision=r.latest_revision)
        res = api_client.post("/api/v3/approval_request/{}/approve/".format(a.id))
        assert res.status_code == 400
        assert res.data["comment"] == "This field is required."

    def test_approve_not_actionable(self, api_client):
        r = RecipeFactory()
        a = ApprovalRequestFactory(revision=r.latest_revision)
        a.approve(UserFactory(), "r+")

        res = api_client.post(
            "/api/v3/approval_request/{}/approve/".format(a.id), {"comment": "r+"}
        )
        assert res.status_code == 400
        assert res.data["error"] == "This approval request has already been approved or rejected."

    def test_reject(self, api_client):
        r = RecipeFactory()
        a = ApprovalRequestFactory(revision=r.latest_revision)
        res = api_client.post(
            "/api/v3/approval_request/{}/reject/".format(a.id), {"comment": "r-"}
        )
        assert res.status_code == 200

        r.latest_revision.approval_request.refresh_from_db()
        assert r.latest_revision.approval_status == r.latest_revision.REJECTED
        assert r.latest_revision.approval_request.comment == "r-"

    def test_reject_no_comment(self, api_client):
        r = RecipeFactory()
        a = ApprovalRequestFactory(revision=r.latest_revision)
        res = api_client.post("/api/v3/approval_request/{}/reject/".format(a.id))
        assert res.status_code == 400
        assert res.data["comment"] == "This field is required."

    def test_reject_not_actionable(self, api_client):
        r = RecipeFactory()
        a = ApprovalRequestFactory(revision=r.latest_revision)
        a.approve(UserFactory(), "r+")

        res = api_client.post(
            "/api/v3/approval_request/{}/reject/".format(a.id), {"comment": "-r"}
        )
        assert res.status_code == 400
        assert res.data["error"] == "This approval request has already been approved or rejected."

    def test_close(self, api_client):
        r = RecipeFactory()
        a = ApprovalRequestFactory(revision=r.latest_revision)
        res = api_client.post("/api/v3/approval_request/{}/close/".format(a.id))
        assert res.status_code == 204

        with pytest.raises(ApprovalRequest.DoesNotExist):
            ApprovalRequest.objects.get(pk=a.pk)


@pytest.mark.django_db
class TestApprovalFlow(object):
    def verify_signatures(self, api_client, expected_count=None):
        res = api_client.get("/api/v1/recipe/signed/")
        assert res.status_code == 200
        signed_data = res.json()

        if expected_count is not None:
            assert len(signed_data) == expected_count

        for recipe_and_signature in signed_data:
            recipe = recipe_and_signature["recipe"]
            expected_signature = recipe_and_signature["signature"]["signature"]
            data = canonical_json_dumps(recipe).encode()
            actual_signature = fake_sign([data])[0]["signature"]
            assert actual_signature == expected_signature

    def test_full_approval_flow(self, settings, api_client, mocked_autograph):
        # The `mocked_autograph` fixture is provided so that recipes can be signed

        settings.PEER_APPROVAL_ENFORCED = True

        action = ActionFactory()
        user1 = UserFactory(is_superuser=True)
        user2 = UserFactory(is_superuser=True)
        api_client.force_authenticate(user1)

        # Create a recipe
        res = api_client.post(
            "/api/v3/recipe/",
            {
                "action_id": action.id,
                "arguments": {},
                "name": "test recipe",
                "extra_filter_expression": "counter == 0",
                "enabled": "false",
            },
        )
        assert res.status_code == 201
        recipe_data_0 = res.json()

        # Request approval for it
        res = api_client.post(
            "/api/v3/recipe_revision/{}/request_approval/".format(
                recipe_data_0["latest_revision"]["id"]
            )
        )
        approval_data = res.json()
        assert res.status_code == 201

        # The requester isn't allowed to approve a recipe
        res = api_client.post(
            "/api/v3/approval_request/{}/approve/".format(approval_data["id"]), {"comment": "r+"}
        )
        assert res.status_code == 403  # Forbidden

        # Approve and enable the recipe
        api_client.force_authenticate(user2)
        res = api_client.post(
            "/api/v3/approval_request/{}/approve/".format(approval_data["id"]), {"comment": "r+"}
        )
        assert res.status_code == 200
        res = api_client.post("/api/v3/recipe/{}/enable/".format(recipe_data_0["id"]))
        assert res.status_code == 200

        # It is now visible in the API
        res = api_client.get("/api/v3/recipe/{}/".format(recipe_data_0["id"]))
        assert res.status_code == 200
        recipe_data_1 = res.json()
        self.verify_signatures(api_client, expected_count=1)

        # Make another change
        api_client.force_authenticate(user1)
        res = api_client.patch(
            "/api/v3/recipe/{}/".format(recipe_data_1["id"]),
            {"extra_filter_expression": "counter == 1"},
        )
        assert res.status_code == 200

        # The change should not be visible yet, since it isn't approved
        res = api_client.get("/api/v3/recipe/{}/".format(recipe_data_1["id"]))
        assert res.status_code == 200
        recipe_data_2 = res.json()
        assert recipe_data_2["extra_filter_expression"] == "counter == 0"
        self.verify_signatures(api_client, expected_count=1)

        # Request approval for the change
        res = api_client.post(
            "/api/v3/recipe_revision/{}/request_approval/".format(
                recipe_data_2["latest_revision"]["id"]
            )
        )
        approval_data = res.json()
        recipe_data_2["approval_request"] = approval_data
        recipe_data_2["latest_revision"]["approval_request"] = approval_data
        assert res.status_code == 201

        # The change should not be visible yet, since it isn't approved
        res = api_client.get("/api/v3/recipe/{}/".format(recipe_data_1["id"]))
        assert res.status_code == 200
        assert res.json() == recipe_data_2
        self.verify_signatures(api_client, expected_count=1)

        # Reject the change
        api_client.force_authenticate(user2)
        res = api_client.post(
            "/api/v3/approval_request/{}/reject/".format(approval_data["id"]), {"comment": "r-"}
        )
        approval_data = res.json()
        recipe_data_2["approval_request"] = approval_data
        recipe_data_2["latest_revision"]["approval_request"] = approval_data
        assert res.status_code == 200

        # The change should not be visible yet, since it isn't approved
        res = api_client.get("/api/v3/recipe/{}/".format(recipe_data_1["id"]))
        assert res.status_code == 200
        assert res.json() == recipe_data_2
        self.verify_signatures(api_client, expected_count=1)

        # Make a third version of the recipe
        api_client.force_authenticate(user1)
        res = api_client.patch(
            "/api/v3/recipe/{}/".format(recipe_data_1["id"]),
            {"extra_filter_expression": "counter == 2"},
        )
        recipe_data_3 = res.json()
        assert res.status_code == 200

        # Request approval
        res = api_client.post(
            "/api/v3/recipe_revision/{}/request_approval/".format(
                recipe_data_3["latest_revision"]["id"]
            )
        )
        approval_data = res.json()
        assert res.status_code == 201

        # Approve the change
        api_client.force_authenticate(user2)
        res = api_client.post(
            "/api/v3/approval_request/{}/approve/".format(approval_data["id"]), {"comment": "r+"}
        )
        assert res.status_code == 200

        # The change should be visible now, since it is approved
        res = api_client.get("/api/v3/recipe/{}/".format(recipe_data_1["id"]))
        assert res.status_code == 200
        recipe_data_4 = res.json()
        assert recipe_data_4["extra_filter_expression"] == "counter == 2"
        self.verify_signatures(api_client, expected_count=1)

    def test_cancel_approval(self, api_client, mocked_autograph):
        action = ActionFactory()
        user1 = UserFactory(is_superuser=True)
        user2 = UserFactory(is_superuser=True)
        api_client.force_authenticate(user1)

        # Create a recipe
        res = api_client.post(
            "/api/v3/recipe/",
            {
                "action_id": action.id,
                "arguments": {},
                "name": "test recipe",
                "extra_filter_expression": "counter == 0",
                "enabled": "false",
            },
        )
        assert res.status_code == 201
        recipe_id = res.json()["id"]
        revision_id = res.json()["latest_revision"]["id"]

        # Request approval
        res = api_client.post(f"/api/v3/recipe_revision/{revision_id}/request_approval/")
        assert res.status_code == 201
        approval_request_id = res.json()["id"]

        # Approve the recipe
        api_client.force_authenticate(user2)
        res = api_client.post(
            f"/api/v3/approval_request/{approval_request_id}/approve/", {"comment": "r+"}
        )
        assert res.status_code == 200

        # The API shouldn't have any signed recipe yet
        self.verify_signatures(api_client, expected_count=0)

        # Enable the recipe
        res = api_client.post(f"/api/v3/recipe/{recipe_id}/enable/")
        assert res.status_code == 200

        # The API should have correct signatures now
        self.verify_signatures(api_client, expected_count=1)

        # Make another change
        api_client.force_authenticate(user1)
        res = api_client.patch(
            f"/api/v3/recipe/{recipe_id}/", {"extra_filter_expression": "counter == 1"}
        )
        assert res.status_code == 200
        revision_id = res.json()["latest_revision"]["id"]

        # Request approval for the second change
        res = api_client.post(f"/api/v3/recipe_revision/{revision_id}/request_approval/")
        approval_request_id = res.json()["id"]
        assert res.status_code == 201

        # Cancel the approval request
        res = api_client.post(f"/api/v3/approval_request/{approval_request_id}/close/")
        assert res.status_code == 204

        # The API should still have correct signatures
        self.verify_signatures(api_client, expected_count=1)


@pytest.mark.django_db
@pytest.mark.parametrize(
    "endpoint,Factory",
    [
        ("/api/v3/action/", ActionFactory),
        ("/api/v3/recipe/", RecipeFactory),
        ("/api/v3/recipe_revision/", RecipeRevisionFactory),
        ("/api/v3/approval_request/", ApprovalRequestFactory),
    ],
)
def test_apis_makes_a_reasonable_number_of_db_queries(endpoint, Factory, client, settings):
    # Naive versions of this view could easily make several queries
    # per item, which is very slow. Make sure that isn't the case.
    Factory.create_batch(100)
    queries = CaptureQueriesContext(connection)
    with queries:
        res = client.get(endpoint)
        assert res.status_code == 200

    # Pagination naturally makes one query per item in the page. Anything
    # under `page_size * 2` isn't doing any additional queries per recipe.
    page_size = settings.REST_FRAMEWORK["PAGE_SIZE"]
    assert len(queries) < page_size * 2


@pytest.mark.django_db
class TestFilterObjects(object):
    def make_recipe(self, api_client, **kwargs):
        data = {
            "name": "Test Recipe",
            "action_id": ActionFactory().id,
            "arguments": {},
            "enabled": True,
        }
        data.update(kwargs)
        return api_client.post("/api/v3/recipe/", data)

    def test_bad_filter_objects(self, api_client):
        res = self.make_recipe(api_client, filter_object={})  # not a list
        assert res.status_code == 400
        assert res.json() == {
            "filter_object": {"non field errors": ["filter_object must be a list."]}
        }

        res = self.make_recipe(api_client, filter_object=["1 + 1 == 2"])  # not a list of objects
        assert res.status_code == 400
        assert res.json() == {
            "filter_object": {
                "0": {"non field errors": ["filter_object members must be objects."]}
            }
        }

        res = self.make_recipe(api_client, filter_object=[{"channels": ["release"]}])
        assert res.status_code == 400
        assert res.json() == {"filter_object": {"0": {"type": ["This field is required."]}}}

    def test_channel_works(self, api_client):
        res = self.make_recipe(
            api_client, filter_object=[{"type": "channel", "channels": ["release", "beta"]}]
        )
        assert res.status_code == 201, res.json()
        assert res.json()["filter_expression"] == ('normandy.channel in ["release","beta"]')

    def test_channel_correct_fields(self, api_client):
        res = self.make_recipe(api_client, filter_object=[{"type": "channel"}])
        assert res.status_code == 400
        assert res.json() == {"filter_object": {"0": {"channels": ["This field is required."]}}}

    def test_locale_works(self, api_client):
        res = self.make_recipe(
            api_client, filter_object=[{"type": "locale", "locales": ["en-US", "de"]}]
        )
        assert res.status_code == 201, res.json()
        assert res.json()["filter_expression"] == ('normandy.locale in ["en-US","de"]')

    def test_locale_correct_fields(self, api_client):
        res = self.make_recipe(api_client, filter_object=[{"type": "locale"}])
        assert res.status_code == 400
        assert res.json() == {"filter_object": {"0": {"locales": ["This field is required."]}}}

    def test_country_works(self, api_client):
        res = self.make_recipe(
            api_client, filter_object=[{"type": "country", "countries": ["US", "DE"]}]
        )
        assert res.status_code == 201, res.json()
        assert res.json()["filter_expression"] == ('normandy.country in ["US","DE"]')

    def test_country_correct_fields(self, api_client):
        res = self.make_recipe(api_client, filter_object=[{"type": "country"}])
        assert res.status_code == 400
        assert res.json() == {"filter_object": {"0": {"countries": ["This field is required."]}}}

    def test_bucket_sample_works(self, api_client):
        res = self.make_recipe(
            api_client,
            filter_object=[
                {
                    "type": "bucketSample",
                    "start": 1,
                    "count": 2,
                    "total": 3,
                    "input": ["normandy.userId", "normandy.recipeId"],
                }
            ],
        )
        assert res.status_code == 201, res.json()
        assert res.json()["filter_expression"] == (
            "[normandy.userId,normandy.recipeId]|bucketSample(1.0,2.0,3.0)"
        )

    def test_bucket_sample_correct_fields(self, api_client):
        res = self.make_recipe(api_client, filter_object=[{"type": "bucketSample"}])
        assert res.status_code == 400
        assert res.json() == {
            "filter_object": {
                "0": {
                    "start": ["This field is required."],
                    "count": ["This field is required."],
                    "total": ["This field is required."],
                    "input": ["This field is required."],
                }
            }
        }

        res = self.make_recipe(
            api_client,
            filter_object=[{"type": "bucketSample", "start": "a", "count": -1, "total": -2}],
        )
        assert res.status_code == 400
        assert res.json() == {
            "filter_object": {
                "0": {
                    "start": ["A valid number is required."],
                    "count": ["Ensure this value is greater than or equal to 0."],
                    "total": ["Ensure this value is greater than or equal to 0."],
                    "input": ["This field is required."],
                }
            }
        }

    def test_stable_sample_works(self, api_client):
        res = self.make_recipe(
            api_client,
            filter_object=[
                {
                    "type": "stableSample",
                    "rate": 0.5,
                    "input": ["normandy.userId", "normandy.recipeId"],
                }
            ],
        )
        assert res.status_code == 201, res.json()
        assert res.json()["filter_expression"] == (
            "[normandy.userId,normandy.recipeId]|stableSample(0.5)"
        )

    def test_stable_sample_correct_fields(self, api_client):
        res = self.make_recipe(api_client, filter_object=[{"type": "stableSample"}])
        assert res.status_code == 400
        assert res.json() == {
            "filter_object": {
                "0": {"rate": ["This field is required."], "input": ["This field is required."]}
            }
        }

        res = self.make_recipe(api_client, filter_object=[{"type": "stableSample", "rate": 10}])
        assert res.status_code == 400
        assert res.json() == {
            "filter_object": {
                "0": {
                    "rate": ["Ensure this value is less than or equal to 1."],
                    "input": ["This field is required."],
                }
            }
        }

    def test_version_works(self, api_client):
        res = self.make_recipe(
            api_client, filter_object=[{"type": "version", "versions": [57, 58]}]
        )
        assert res.status_code == 201, res.json()
        assert res.json()["filter_expression"] == (
            '(normandy.version>="57"&&normandy.version<"58")||'
            '(normandy.version>="58"&&normandy.version<"59")'
        )

    def test_version_correct_fields(self, api_client):
        res = self.make_recipe(api_client, filter_object=[{"type": "version"}])
        assert res.status_code == 400
        assert res.json() == {"filter_object": {"0": {"versions": ["This field is required."]}}}

    def test_invalid_filter(self, api_client):
        res = self.make_recipe(api_client, filter_object=[{"type": "invalid"}])
        assert res.status_code == 400
        assert res.json() == {
            "filter_object": {"0": {"type": ['Unknown filter object type "invalid".']}}
        }
