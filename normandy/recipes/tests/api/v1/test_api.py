import hashlib
from unittest.mock import patch

from django.db import connection
from django.test.utils import CaptureQueriesContext

import pytest
from rest_framework.reverse import reverse

from normandy.base.tests import UserFactory, Whatever
from normandy.base.utils import aware_datetime
from normandy.recipes.tests import (
    ActionFactory,
    ApprovalRequestFactory,
    ChannelFactory,
    CountryFactory,
    LocaleFactory,
    RecipeFactory,
    RecipeRevisionFactory,
)


@pytest.mark.django_db
class TestActionAPI(object):
    def test_it_works(self, api_client):
        res = api_client.get("/api/v1/action/")
        assert res.status_code == 200
        assert res.data == []

    def test_it_serves_actions(self, api_client):
        action = ActionFactory(
            name="foo", implementation="foobar", arguments_schema={"type": "object"}
        )

        res = api_client.get("/api/v1/action/")
        action_url = reverse(
            "recipes:action-implementation",
            kwargs={"name": action.name, "impl_hash": action.implementation_hash},
        )
        assert res.status_code == 200
        assert res.data == [
            {
                "name": "foo",
                "implementation_url": Whatever.endswith(action_url),
                "arguments_schema": {"type": "object"},
            }
        ]

    def test_it_serves_actions_without_implementation(self, api_client):
        ActionFactory(name="foo-remote", implementation=None, arguments_schema={"type": "object"})

        res = api_client.get("/api/v1/action/")
        assert res.status_code == 200
        assert res.data == [
            {
                "name": "foo-remote",
                "implementation_url": None,
                "arguments_schema": {"type": "object"},
            }
        ]

    def test_name_validation(self, api_client):
        """Ensure the name field accepts _any_ valid slug."""
        # Slugs can contain alphanumerics plus _ and -.
        action = ActionFactory(name="foo-bar_baz2")

        res = api_client.get("/api/v1/action/foo-bar_baz2/")
        assert res.status_code == 200
        assert res.data["name"] == action.name

    def test_list_view_includes_cache_headers(self, api_client):
        res = api_client.get("/api/v1/action/")
        assert res.status_code == 200
        # It isn't important to assert a particular value for max-age
        assert "max-age=" in res["Cache-Control"]
        assert "public" in res["Cache-Control"]

    def test_detail_view_includes_cache_headers(self, api_client):
        action = ActionFactory()
        res = api_client.get("/api/v1/action/{name}/".format(name=action.name))
        assert res.status_code == 200
        # It isn't important to assert a particular value for max-age
        assert "max-age=" in res["Cache-Control"]
        assert "public" in res["Cache-Control"]

    def test_list_sets_no_cookies(self, api_client):
        res = api_client.get("/api/v1/action/")
        assert res.status_code == 200
        assert "Cookies" not in res

    def test_detail_sets_no_cookies(self, api_client):
        action = ActionFactory()
        res = api_client.get("/api/v1/action/{name}/".format(name=action.name))
        assert res.status_code == 200
        assert res.client.cookies == {}

    def test_signed_listing_works(self, api_client):
        a1 = ActionFactory(signed=True)
        res = api_client.get("/api/v1/action/signed/")
        assert res.status_code == 200
        assert len(res.data) == 1
        assert res.data[0]["action"]["name"] == a1.name
        assert res.data[0]["signature"]["signature"] == a1.signature.signature

    def test_signed_only_lists_signed_actions(self, api_client):
        # Names must be alphabetical, so the API response can be
        # sorted by name later, since actions don't expose an ID in
        # the API.
        a1 = ActionFactory(name="a", signed=True)
        a2 = ActionFactory(name="b", signed=True)
        ActionFactory(signed=False)
        res = api_client.get("/api/v1/action/signed/")
        assert res.status_code == 200
        assert len(res.data) == 2

        res.data.sort(key=lambda r: r["action"]["name"])

        assert res.data[0]["action"]["name"] == a1.name
        assert res.data[0]["signature"]["signature"] == a1.signature.signature
        assert res.data[1]["action"]["name"] == a2.name
        assert res.data[1]["signature"]["signature"] == a2.signature.signature


@pytest.mark.django_db
class TestImplementationAPI(object):
    def test_it_serves_implementations(self, api_client):
        action = ActionFactory()
        res = api_client.get(
            "/api/v1/action/{name}/implementation/{hash}/".format(
                name=action.name, hash=action.implementation_hash
            )
        )
        assert res.status_code == 200
        assert res.content.decode() == action.implementation
        assert res["Content-Type"] == "application/javascript; charset=utf-8"

    def test_it_404s_if_hash_doesnt_match(self, api_client):
        action = ActionFactory(implementation="asdf")
        bad_hash = hashlib.sha1("nomatch".encode()).hexdigest()
        res = api_client.get(
            "/api/v1/action/{name}/implementation/{hash}/".format(name=action.name, hash=bad_hash)
        )
        assert res.status_code == 404
        assert res.content.decode() == "/* Hash does not match current stored action. */"
        assert res["Content-Type"] == "application/javascript; charset=utf-8"

    def test_it_includes_cache_headers(self, api_client, settings):
        # Note: Can't override the cache time setting, since it is read
        # when invoking the decorator at import time. Changing it would
        # require mocking, and that isn't worth it.
        action = ActionFactory()
        res = api_client.get(
            "/api/v1/action/{name}/implementation/{hash}/".format(
                name=action.name, hash=action.implementation_hash
            )
        )
        assert res.status_code == 200

        max_age = "max-age={}".format(settings.IMMUTABLE_CACHE_TIME)
        assert max_age in res["Cache-Control"]
        assert "public" in res["Cache-Control"]

    def test_sets_no_cookies(self, api_client):
        action = ActionFactory()
        res = api_client.get(
            "/api/v1/action/{name}/implementation/{hash}/".format(
                name=action.name, hash=action.implementation_hash
            )
        )
        assert res.status_code == 200
        assert res.client.cookies == {}


@pytest.mark.django_db
class TestRecipeAPI(object):
    @pytest.mark.django_db
    class TestListing(object):
        def test_it_works(self, api_client):
            res = api_client.get("/api/v1/recipe/")
            assert res.status_code == 200
            assert res.data == []

        def test_it_serves_recipes(self, api_client):
            recipe = RecipeFactory()

            res = api_client.get("/api/v1/recipe/")
            assert res.status_code == 200
            assert res.data[0]["name"] == recipe.name

        def test_available_if_admin_enabled(self, api_client, settings):
            settings.ADMIN_ENABLED = True
            res = api_client.get("/api/v1/recipe/")
            assert res.status_code == 200
            assert res.data == []

        def test_list_view_includes_cache_headers(self, api_client):
            res = api_client.get("/api/v1/recipe/")
            assert res.status_code == 200
            # It isn't important to assert a particular value for max_age
            assert "max-age=" in res["Cache-Control"]
            assert "public" in res["Cache-Control"]

        def test_list_sets_no_cookies(self, api_client):
            res = api_client.get("/api/v1/recipe/")
            assert res.status_code == 200
            assert "Cookies" not in res

    @pytest.mark.django_db
    class TestDetail(object):
        def test_detail_view_includes_cache_headers(self, api_client):
            recipe = RecipeFactory()
            res = api_client.get(f"/api/v1/recipe/{recipe.id}/")
            assert res.status_code == 200
            # It isn't important to assert a particular value for max-age
            assert "max-age=" in res["Cache-Control"]
            assert "public" in res["Cache-Control"]

        def test_history(self, api_client):
            recipe = RecipeFactory(name="version 1")
            recipe.revise(name="version 2")
            recipe.revise(name="version 3")

            res = api_client.get("/api/v1/recipe/%s/history/" % recipe.id)

            assert res.data[0]["recipe"]["name"] == "version 3"
            assert res.data[1]["recipe"]["name"] == "version 2"
            assert res.data[2]["recipe"]["name"] == "version 1"

        def test_detail_sets_no_cookies(self, api_client):
            recipe = RecipeFactory()
            res = api_client.get("/api/v1/recipe/{id}/".format(id=recipe.id))
            assert res.status_code == 200
            assert res.client.cookies == {}

    @pytest.mark.django_db
    class TestFiltering(object):
        def test_filtering_by_enabled_lowercase(self, api_client):
            r1 = RecipeFactory(approver=UserFactory(), enabler=UserFactory())
            RecipeFactory()

            res = api_client.get("/api/v1/recipe/?enabled=true")
            assert res.status_code == 200
            assert [r["id"] for r in res.data] == [r1.id]

        def test_filtering_by_enabled_fuzz(self, api_client):
            """
            Test that we don't return 500 responses when we get unexpected boolean filters.

            This was a real case that showed up in our error logging.
            """
            url = (
                "/api/v1/recipe/?enabled=javascript%3a%2f*"
                "<%2fscript><svg%2fonload%3d'%2b%2f'%2f%2b"
            )
            res = api_client.get(url)
            assert res.status_code == 200

        def test_list_filter_status(self, api_client):
            r1 = RecipeFactory()
            r2 = RecipeFactory(approver=UserFactory(), enabler=UserFactory())

            res = api_client.get("/api/v1/recipe/?status=enabled")
            assert res.status_code == 200
            assert len(res.data) == 1
            assert res.data[0]["id"] == r2.id

            res = api_client.get("/api/v1/recipe/?status=disabled")
            assert res.status_code == 200
            assert len(res.data) == 1
            assert res.data[0]["id"] == r1.id

        def test_list_filter_channels(self, api_client):
            r1 = RecipeFactory(channels=[ChannelFactory(slug="beta")])
            r2 = RecipeFactory(channels=[ChannelFactory(slug="release")])

            res = api_client.get("/api/v1/recipe/?channels=beta")
            assert res.status_code == 200
            assert len(res.data) == 1
            assert res.data[0]["id"] == r1.id

            res = api_client.get("/api/v1/recipe/?channels=beta,release")
            assert res.status_code == 200
            assert len(res.data) == 2
            for recipe in res.data:
                assert recipe["id"] in [r1.id, r2.id]

        def test_list_filter_channels_null_bytes(self, api_client):
            res = api_client.get("/api/v1/recipe/?channels=\x00")
            assert res.status_code == 400

        def test_list_filter_countries(self, api_client):
            r1 = RecipeFactory(countries=[CountryFactory(code="US")])
            r2 = RecipeFactory(countries=[CountryFactory(code="CA")])

            res = api_client.get("/api/v1/recipe/?countries=US")
            assert res.status_code == 200
            assert len(res.data) == 1
            assert res.data[0]["id"] == r1.id

            res = api_client.get("/api/v1/recipe/?countries=US,CA")
            assert res.status_code == 200
            assert len(res.data) == 2
            for recipe in res.data:
                assert recipe["id"] in [r1.id, r2.id]

        def test_list_filter_countries_with_null_bytes(self, api_client):
            res = api_client.get("/api/v1/recipe/?countries=\x00")
            assert res.status_code == 400

        def test_list_filter_locales(self, api_client):
            r1 = RecipeFactory(locales=[LocaleFactory(code="en-US")])
            r2 = RecipeFactory(locales=[LocaleFactory(code="fr-CA")])

            res = api_client.get("/api/v1/recipe/?locales=en-US")
            assert res.status_code == 200
            assert len(res.data) == 1
            assert res.data[0]["id"] == r1.id

            res = api_client.get("/api/v1/recipe/?locales=en-US,fr-CA")
            assert res.status_code == 200
            assert len(res.data) == 2
            for recipe in res.data:
                assert recipe["id"] in [r1.id, r2.id]

        def test_list_filter_locales_null_bytes(self, api_client):
            res = api_client.get("/api/v1/recipe/?locales=\x00")
            assert res.status_code == 400

        def test_list_filter_text(self, api_client):
            r1 = RecipeFactory(name="first", extra_filter_expression="1 + 1 == 2")
            r2 = RecipeFactory(name="second", extra_filter_expression="one + one == two")

            res = api_client.get("/api/v1/recipe/?text=first")
            assert res.status_code == 200
            assert len(res.data) == 1
            assert res.data[0]["id"] == r1.id

            res = api_client.get("/api/v1/recipe/?text=one")
            assert res.status_code == 200
            assert len(res.data) == 1
            assert res.data[0]["id"] == r2.id

            res = api_client.get("/api/v1/recipe/?text=t")
            assert res.status_code == 200
            assert len(res.data) == 2
            for recipe in res.data:
                assert recipe["id"] in [r1.id, r2.id]

        def test_list_filter_action_legacy(self, api_client):
            a1 = ActionFactory()
            a2 = ActionFactory()
            r1 = RecipeFactory(action=a1)
            r2 = RecipeFactory(action=a2)

            assert a1.id != a2.id

            res = api_client.get(f"/api/v1/recipe/?latest_revision__action={a1.id}")
            assert res.status_code == 200
            assert [r["id"] for r in res.data] == [r1.id]

            res = api_client.get(f"/api/v1/recipe/?latest_revision__action={a2.id}")
            assert res.status_code == 200
            assert [r["id"] for r in res.data] == [r2.id]

            assert a1.id != -1 and a2.id != -1
            res = api_client.get("/api/v1/recipe/?latest_revision__action=-1")
            assert res.status_code == 400
            assert res.data["latest_revision__action"][0].code == "invalid_choice"

        def test_list_filter_action(self, api_client):
            a1 = ActionFactory()
            a2 = ActionFactory()
            r1 = RecipeFactory(action=a1)
            r2 = RecipeFactory(action=a2)

            assert a1.name != a2.name

            res = api_client.get(f"/api/v1/recipe/?action={a1.name}")
            assert res.status_code == 200
            assert [r["id"] for r in res.data] == [r1.id]

            res = api_client.get(f"/api/v1/recipe/?action={a2.name}")
            assert res.status_code == 200
            assert [r["id"] for r in res.data] == [r2.id]

            assert a1.name != "nonexistant" and a2.name != "nonexistant"
            res = api_client.get("/api/v1/recipe/?action=nonexistant")
            assert res.status_code == 200
            assert res.data == []

    @pytest.mark.django_db
    class TestSigned(object):
        def test_signed_listing_works(self, api_client):
            r1 = RecipeFactory(signed=True)
            res = api_client.get("/api/v1/recipe/signed/")
            assert res.status_code == 200
            assert len(res.data) == 1
            assert res.data[0]["recipe"]["id"] == r1.id
            assert res.data[0]["signature"]["signature"] == r1.signature.signature

        def test_signed_view_includes_cache_headers(self, api_client):
            res = api_client.get("/api/v1/recipe/signed/")
            assert res.status_code == 200
            # It isn't important to assert a particular value for max-age
            assert "max-age=" in res["Cache-Control"]
            assert "public" in res["Cache-Control"]

        def test_signed_only_lists_signed_recipes(self, api_client):
            r1 = RecipeFactory(signed=True)
            r2 = RecipeFactory(signed=True)
            RecipeFactory(signed=False)
            res = api_client.get("/api/v1/recipe/signed/")
            assert res.status_code == 200
            assert len(res.data) == 2

            res.data.sort(key=lambda r: r["recipe"]["id"])

            assert res.data[0]["recipe"]["id"] == r1.id
            assert res.data[0]["signature"]["signature"] == r1.signature.signature
            assert res.data[1]["recipe"]["id"] == r2.id
            assert res.data[1]["signature"]["signature"] == r2.signature.signature

        def test_signed_listing_filters_by_enabled(Self, api_client):
            enabled_recipe = RecipeFactory(
                signed=True, approver=UserFactory(), enabler=UserFactory()
            )
            disabled_recipe = RecipeFactory(signed=True)

            res = api_client.get("/api/v1/recipe/signed/?enabled=1")
            assert res.status_code == 200
            assert len(res.data) == 1
            assert res.data[0]["recipe"]["id"] == enabled_recipe.id

            res = api_client.get("/api/v1/recipe/signed/?enabled=0")
            assert res.status_code == 200
            assert len(res.data) == 1
            assert res.data[0]["recipe"]["id"] == disabled_recipe.id


@pytest.mark.django_db
class TestRecipeRevisionAPI(object):
    def test_it_works(self, api_client):
        res = api_client.get("/api/v1/recipe_revision/")
        assert res.status_code == 200
        assert res.data == []

    def test_it_serves_revisions(self, api_client):
        recipe = RecipeFactory()
        res = api_client.get("/api/v1/recipe_revision/%s/" % recipe.latest_revision.id)
        assert res.status_code == 200
        assert res.data["id"] == recipe.latest_revision.id


@pytest.mark.django_db
class TestApprovalRequestAPI(object):
    def test_it_works(self, api_client):
        res = api_client.get("/api/v1/approval_request/")
        assert res.status_code == 200
        assert res.data == []


@pytest.mark.django_db
class TestClassifyClient(object):
    def test_it_works(self, api_client):
        get_country_code_patch = patch("normandy.recipes.models.get_country_code")
        timezone_patch = patch("normandy.base.middleware.timezone")

        with get_country_code_patch as get_country_code, timezone_patch as timezone:
            get_country_code.return_value = "us"
            timezone.now.return_value = aware_datetime(2016, 1, 1)
            res = api_client.get("/api/v1/classify_client/")

        assert res.status_code == 200
        assert res.data == {"country": "us", "request_time": "2016-01-01T00:00:00Z"}

    def test_makes_no_db_queries(self, client):
        queries = CaptureQueriesContext(connection)
        with queries:
            res = client.get("/api/v1/classify_client/")
            assert res.status_code == 200
        assert len(queries) == 0

    def test_sets_no_cookies(self, api_client):
        res = api_client.get("/api/v1/classify_client/")
        assert res.status_code == 200
        assert res.client.cookies == {}


@pytest.mark.django_db
@pytest.mark.parametrize(
    "endpoint,Factory",
    [
        ("/api/v1/action/", ActionFactory),
        ("/api/v1/action/signed/", ActionFactory),
        ("/api/v1/recipe/", RecipeFactory),
        ("/api/v1/recipe/signed/", RecipeFactory),
        ("/api/v1/recipe_revision/", RecipeRevisionFactory),
        ("/api/v1/approval_request/", ApprovalRequestFactory),
    ],
)
def test_apis_make_a_reasonable_number_of_db_queries(client, endpoint, Factory):
    """
    Naive versions of these views could easily make several queries
    per item, which is very slow. Make sure that isn't the case.
    """
    Factory.create_batch(100)
    queries = CaptureQueriesContext(connection)
    with queries:
        res = client.get(endpoint)
        assert res.status_code == 200
    # Anything under 100 isn't doing one query per recipe.
    assert len(queries) < 100
