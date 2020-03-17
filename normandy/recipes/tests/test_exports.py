import base64
from unittest.mock import call

import pytest
import kinto_http
from django.core.exceptions import ImproperlyConfigured
from kinto_http.session import USER_AGENT as KINTO_USER_AGENT

from normandy.base.tests import UserFactory
from normandy.recipes import exports
from normandy.recipes.tests import RecipeFactory
from normandy.base.tests import Whatever


@pytest.fixture
def mock_logger(mocker):
    return mocker.patch("normandy.recipes.exports.logger")


@pytest.mark.django_db
class TestRemoteSettings:
    @pytest.fixture
    def rs_urls(self, rs_settings):
        rv = {"workspace": {}, "publish": {}}
        rv["workspace"]["collection"] = (
            f"{rs_settings.REMOTE_SETTINGS_URL}"
            f"/buckets/{rs_settings.REMOTE_SETTINGS_WORKSPACE_BUCKET_ID}"
            f"/collections/{rs_settings.REMOTE_SETTINGS_CAPABILITIES_COLLECTION_ID}"
        )
        rv["publish"]["collection"] = (
            f"{rs_settings.REMOTE_SETTINGS_URL}"
            f"/buckets/{rs_settings.REMOTE_SETTINGS_PUBLISH_BUCKET_ID}"
            f"/collections/{rs_settings.REMOTE_SETTINGS_CAPABILITIES_COLLECTION_ID}"
        )

        for bucket in ["workspace", "publish"]:
            rv[bucket]["records"] = rv[bucket]["collection"] + "/records"
            rv[bucket]["record"] = rv[bucket]["collection"] + "/records/{}"

        return rv

    def test_default_settings(self, settings):
        """Test default settings values."""

        assert settings.REMOTE_SETTINGS_URL is None
        assert settings.REMOTE_SETTINGS_USERNAME is None
        assert settings.REMOTE_SETTINGS_PASSWORD is None
        assert settings.REMOTE_SETTINGS_WORKSPACE_BUCKET_ID == "main-workspace"
        assert settings.REMOTE_SETTINGS_PUBLISH_BUCKET_ID == "main"
        assert (
            settings.REMOTE_SETTINGS_CAPABILITIES_COLLECTION_ID == "normandy-recipes-capabilities"
        )
        assert settings.REMOTE_SETTINGS_RETRY_REQUESTS == 3

    def test_it_checks_config(self, settings):
        """Test that each required key is required individually"""

        # Leave out URL with Remote Settings (default)
        settings.REMOTE_SETTINGS_URL = None
        # assert doesn't raise
        exports.RemoteSettings().check_config()

        # Set empty URL
        settings.REMOTE_SETTINGS_URL = ""
        # assert doesn't raise
        exports.RemoteSettings().check_config()

        # Leave out USERNAME
        settings.REMOTE_SETTINGS_URL = "http://some-server/v1"
        settings.REMOTE_SETTINGS_USERNAME = None
        settings.REMOTE_SETTINGS_PASSWORD = "p4ssw0rd"
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings().check_config()
        assert "REMOTE_SETTINGS_USERNAME" in str(exc.value)

        # Set empty USERNAME
        settings.REMOTE_SETTINGS_USERNAME = ""
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings().check_config()
        assert "REMOTE_SETTINGS_USERNAME" in str(exc.value)

        # Leave out PASSWORD
        settings.REMOTE_SETTINGS_URL = "http://some-server/v1"
        settings.REMOTE_SETTINGS_USERNAME = "usename"
        settings.REMOTE_SETTINGS_PASSWORD = None
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings().check_config()
        assert "REMOTE_SETTINGS_PASSWORD" in str(exc.value)

        # Leave out CAPABILITIES_COLLECTION_ID
        settings.REMOTE_SETTINGS_URL = "http://some-server/v1"
        settings.REMOTE_SETTINGS_USERNAME = "usename"
        settings.REMOTE_SETTINGS_PASSWORD = "p4ssw0rd"
        settings.REMOTE_SETTINGS_CAPABILITIES_COLLECTION_ID = None
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings().check_config()
        assert "REMOTE_SETTINGS_CAPABILITIES_COLLECTION_ID" in str(exc.value)

    def test_check_connection(self, rs_settings, requestsmock):
        # Root URL should return currently authenticated user.

        requestsmock.get(f"{rs_settings.REMOTE_SETTINGS_URL}/", json={"capabilities": {}})

        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings().check_config()
        assert "Invalid Remote Settings credentials" in str(exc.value)

        # Collections writable.
        requestsmock.get(
            f"{rs_settings.REMOTE_SETTINGS_URL}/",
            json={
                "user": {"id": f"account:{rs_settings.REMOTE_SETTINGS_USERNAME}"},
                "capabilities": {
                    "signer": {
                        "version": "5.2.0",
                        "to_review_enabled": True,
                        "group_check_enabled": True,
                        "resources": [
                            {
                                "source": {"bucket": "main-workspace", "collection": None},
                                "destination": {"bucket": "main", "collection": None},
                            }
                        ],
                    }
                },
            },
        )

        # Workspace collections should be writable
        bucket = rs_settings.REMOTE_SETTINGS_WORKSPACE_BUCKET_ID
        collection = rs_settings.REMOTE_SETTINGS_CAPABILITIES_COLLECTION_ID
        # Allow writes for all collections
        allow_write_payload = {
            "data": {},
            "permissions": {"write": [f"account:{rs_settings.REMOTE_SETTINGS_USERNAME}"]},
        }
        readonly_payload = {"data": {}, "permissions": {}}
        collection_url = (
            f"{rs_settings.REMOTE_SETTINGS_URL}/buckets/{bucket}/collections/{collection}"
        )
        requestsmock.get(collection_url, json=allow_write_payload)

        collection_url = (
            f"{rs_settings.REMOTE_SETTINGS_URL}/buckets/{bucket}/collections/{collection}"
        )
        # make the collection readonly
        requestsmock.get(collection_url, json=readonly_payload)
        # test it
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings().check_config()
        assert f"Remote Settings collection {collection} is not writable" in str(exc.value)
        # restore write permissions
        requestsmock.get(collection_url, json=allow_write_payload)

        # Signer version should be >= 5.1.0.
        requestsmock.get(
            f"{rs_settings.REMOTE_SETTINGS_URL}/",
            json={
                "user": {"id": f"account:{rs_settings.REMOTE_SETTINGS_USERNAME}"},
                "capabilities": {"signer": {"version": "5.0.0"}},
            },
        )
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings().check_config()
        assert "kinto-signer 5.1.0+ is required" in str(exc.value)

        # Capabilities collection review should be explicitly disabled.
        requestsmock.get(
            f"{rs_settings.REMOTE_SETTINGS_URL}/",
            json={
                "user": {"id": f"account:{rs_settings.REMOTE_SETTINGS_USERNAME}"},
                "capabilities": {"signer": {"version": "5.2.0", "resources": []}},
            },
        )
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings().check_config()
        assert (
            "Review was not disabled on Remote Settings collection "
            f"{rs_settings.REMOTE_SETTINGS_CAPABILITIES_COLLECTION_ID}."
        ) in str(exc.value)

        requestsmock.get(
            f"{rs_settings.REMOTE_SETTINGS_URL}/",
            json={
                "user": {"id": f"account:{rs_settings.REMOTE_SETTINGS_USERNAME}"},
                "capabilities": {
                    "signer": {
                        "version": "5.2.0",
                        "to_review_enabled": True,
                        "group_check_enabled": True,
                        "resources": [
                            {
                                "source": {"bucket": "main-workspace", "collection": None},
                                "destination": {"bucket": "main", "collection": None},
                            },
                            {
                                "source": {
                                    "bucket": "main-workspace",
                                    "collection": "normandy-recipes-capabilities",
                                },
                                "destination": {
                                    "bucket": "main",
                                    "collection": "normandy-recipes-capabilities",
                                },
                                "to_review_enabled": False,
                                "group_check_enabled": False,
                            },
                        ],
                    }
                },
            },
        )

        # Assert does not raise.
        exports.RemoteSettings().check_config()

    def test_publish_and_unpublish_are_noop_if_not_enabled(self, requestsmock):
        recipe = RecipeFactory(name="Test", approver=UserFactory(), enabler=UserFactory())
        remotesettings = exports.RemoteSettings()

        remotesettings.publish(recipe)
        remotesettings.unpublish(recipe)

        assert len(requestsmock.request_history) == 0

    def test_recipe_as_remotesettings_record(self, mocked_autograph):
        """Test that recipes are serialized as expected by our clients."""

        recipe = RecipeFactory(
            name="Test", approver=UserFactory(), enabler=UserFactory(), signed=True
        )

        record = exports.recipe_as_record(recipe)
        assert record == {
            "id": str(recipe.id),
            "recipe": {
                "action": recipe.approved_revision.action.name,
                "arguments": recipe.approved_revision.arguments,
                "filter_expression": recipe.approved_revision.filter_expression,
                "id": recipe.id,
                "name": recipe.approved_revision.name,
                "revision_id": str(recipe.approved_revision.id),
                "capabilities": Whatever(
                    lambda caps: set(caps) == recipe.approved_revision.capabilities
                ),
                "uses_only_baseline_capabilities": False,
            },
            "signature": {
                "public_key": Whatever.regex(r"[a-zA-Z0-9/+]{160}"),
                "signature": Whatever.regex(r"[a-f0-9]{40}"),
                "timestamp": Whatever.iso8601(),
                "x5u": Whatever.startswith("https://"),
            },
        }

    def test_publish_puts_record_and_approves(
        self, rs_urls, rs_settings, requestsmock, mock_logger
    ):
        """Test that requests are sent to Remote Settings on publish."""

        recipe = RecipeFactory(name="Test", approver=UserFactory())
        auth = (
            rs_settings.REMOTE_SETTINGS_USERNAME + ":" + rs_settings.REMOTE_SETTINGS_PASSWORD
        ).encode()
        request_headers = {
            "User-Agent": KINTO_USER_AGENT,
            "Content-Type": "application/json",
            "Authorization": f"Basic {base64.b64encode(auth).decode()}",
        }

        requestsmock.request(
            "PUT",
            rs_urls["workspace"]["record"].format(recipe.id),
            json={"data": {}},
            request_headers=request_headers,
        )
        requestsmock.request(
            "PATCH",
            rs_urls["workspace"]["collection"],
            json={"data": {}},
            request_headers=request_headers,
        )

        remotesettings = exports.RemoteSettings()
        remotesettings.publish(recipe)

        requests = requestsmock.request_history
        assert len(requests) == 2
        assert requests[0].url == rs_urls["workspace"]["record"].format(recipe.id)
        assert requests[0].method == "PUT"
        assert requests[0].json() == {"data": exports.recipe_as_record(recipe)}
        assert requests[1].method == "PATCH"
        assert requests[1].url == rs_urls["workspace"]["collection"]
        mock_logger.info.assert_called_with(
            f"Published record '{recipe.id}' for recipe '{recipe.approved_revision.name}'"
        )

    def test_unpublish_deletes_record_and_approves(
        self, rs_urls, rs_settings, requestsmock, mock_logger
    ):
        """Test that requests are sent to Remote Settings on unpublish."""

        recipe = RecipeFactory(name="Test", approver=UserFactory())
        urls = rs_urls["workspace"]

        auth = (
            rs_settings.REMOTE_SETTINGS_USERNAME + ":" + rs_settings.REMOTE_SETTINGS_PASSWORD
        ).encode()
        request_headers = {
            "User-Agent": KINTO_USER_AGENT,
            "Content-Type": "application/json",
            "Authorization": f"Basic {base64.b64encode(auth).decode()}",
        }
        requestsmock.request(
            "delete",
            urls["record"].format(recipe.id),
            json={"data": {}},
            request_headers=request_headers,
        )
        requestsmock.request(
            "patch", urls["collection"], json={"data": {}}, request_headers=request_headers
        )

        remotesettings = exports.RemoteSettings()
        remotesettings.unpublish(recipe)

        assert len(requestsmock.request_history) == 2
        requests = requestsmock.request_history
        assert requests[0].url == urls["record"].format(recipe.id)
        assert requests[0].method == "DELETE"
        assert requests[1].url == urls["collection"]
        assert requests[1].method == "PATCH"
        mock_logger.info.assert_called_with(
            f"Deleted record '{recipe.id}' of recipe '{recipe.approved_revision.name}'"
        )

    def test_publish_raises_an_error_if_request_fails(self, rs_urls, rs_settings, requestsmock):
        recipe = RecipeFactory(name="Test", approver=UserFactory())
        record_url = rs_urls["workspace"]["record"].format(recipe.id)
        requestsmock.request("put", record_url, status_code=503)

        remotesettings = exports.RemoteSettings()
        with pytest.raises(kinto_http.KintoException):
            remotesettings.publish(recipe)

        assert requestsmock.call_count == rs_settings.REMOTE_SETTINGS_RETRY_REQUESTS + 1

    def test_unpublish_ignores_error_about_missing_records(
        self, rs_urls, rs_settings, requestsmock, mock_logger
    ):
        recipe = RecipeFactory(name="Test", approver=UserFactory())
        capabilities_record_url = rs_urls["workspace"]["record"].format(recipe.id)
        warning_message = (
            f"The recipe '{recipe.id}' was not published in the {{}} collection. Skip."
        )

        requestsmock.request("delete", capabilities_record_url, status_code=404)
        remotesettings = exports.RemoteSettings()
        # Assert doesn't raise.
        remotesettings.unpublish(recipe)
        assert mock_logger.warning.call_args_list == [call(warning_message.format("capabilities"))]

    def test_publish_reverts_changes_if_approval_fails(self, rs_urls, rs_settings, requestsmock):
        # This test forces the recipe to not use baseline capabilities to
        # simplify the test. This simplifies the test.
        recipe = RecipeFactory(name="Test", approver=UserFactory())

        capabilities_record_url = rs_urls["workspace"]["record"].format(recipe.id)
        # Creating the record works.
        requestsmock.request("put", capabilities_record_url, json={"data": {}}, status_code=201)
        requestsmock.register_uri(
            "patch",
            rs_urls["workspace"]["collection"],
            [
                # Approving fails.
                {"status_code": 403},
                # Rollback succeeds.
                {"status_code": 200, "json": {"data": {}}},
            ],
        )

        remotesettings = exports.RemoteSettings()
        with pytest.raises(kinto_http.KintoException):
            remotesettings.publish(recipe)

        requests = requestsmock.request_history
        assert len(requests) == 3
        # First it publishes a recipe
        assert requests[0].method == "PUT"
        assert requests[0].url == capabilities_record_url
        # and then tries to approve it, which fails.
        assert requests[1].method == "PATCH"
        assert requests[1].url == rs_urls["workspace"]["collection"]
        # so it rollsback
        assert requests[2].method == "PATCH"
        assert requests[2].url == rs_urls["workspace"]["collection"]

    def test_unpublish_reverts_changes_if_approval_fails(self, rs_urls, rs_settings, requestsmock):
        recipe = RecipeFactory(name="Test", approver=UserFactory())
        capabilities_record_url = rs_urls["workspace"]["record"].format(recipe.id)
        # Deleting the record works.
        requestsmock.request("delete", capabilities_record_url, json={"data": {"deleted": True}})

        requestsmock.register_uri(
            "patch",
            rs_urls["workspace"]["collection"],
            [
                # Approving fails.
                {"status_code": 403},
                # Rollback succeeds.
                {"status_code": 200, "json": {"data": {}}},
            ],
        )

        remotesettings = exports.RemoteSettings()
        with pytest.raises(kinto_http.KintoException):
            remotesettings.unpublish(recipe)

        requests = requestsmock.request_history
        assert len(requests) == 3
        # Unpublish the recipe in collection
        assert requests[0].url == capabilities_record_url
        assert requests[0].method == "DELETE"
        # Try (and fail) to approve the capabilities change
        assert requests[1].url == rs_urls["workspace"]["collection"]
        assert requests[1].method == "PATCH"
        # so it rollsback collection
        assert requests[2].method == "PATCH"
        assert requests[2].url == rs_urls["workspace"]["collection"]
