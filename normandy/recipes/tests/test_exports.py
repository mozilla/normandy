import base64
import json

import pytest
import kinto_http

from django.core.exceptions import ImproperlyConfigured

from normandy.base.tests import UserFactory
from normandy.recipes import exports
from normandy.recipes.tests import RecipeFactory

from kinto_http.session import USER_AGENT as KINTO_USER_AGENT


@pytest.fixture
def mock_logger(mocker):
    return mocker.patch("normandy.recipes.exports.logger")


@pytest.mark.django_db
class TestRemoteSettings:
    def test_default_settings(self, settings):
        """Test default settings values."""

        assert settings.REMOTE_SETTINGS_URL is None
        assert settings.REMOTE_SETTINGS_USERNAME is None
        assert settings.REMOTE_SETTINGS_PASSWORD is None
        assert settings.REMOTE_SETTINGS_BUCKET_ID == "main-workspace"
        assert settings.REMOTE_SETTINGS_COLLECTION_ID == "normandy-recipes"
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
        assert "REMOTE_SETTINGS_USERNAME" in str(exc)

        # Set empty USERNAME
        settings.REMOTE_SETTINGS_USERNAME = ""
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings().check_config()
        assert "REMOTE_SETTINGS_USERNAME" in str(exc)

        # Leave out PASSWORD
        settings.REMOTE_SETTINGS_URL = "http://some-server/v1"
        settings.REMOTE_SETTINGS_USERNAME = "usename"
        settings.REMOTE_SETTINGS_PASSWORD = None
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings().check_config()
        assert "REMOTE_SETTINGS_PASSWORD" in str(exc)

        # Leave out COLLECTION_ID
        settings.REMOTE_SETTINGS_URL = "http://some-server/v1"
        settings.REMOTE_SETTINGS_USERNAME = "usename"
        settings.REMOTE_SETTINGS_PASSWORD = "p4ssw0rd"
        settings.REMOTE_SETTINGS_COLLECTION_ID = None
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings().check_config()
        assert "REMOTE_SETTINGS_COLLECTION_ID" in str(exc)

    def test_check_connection(self, rs_settings, requestsmock):
        # Root URL should return currently authenticated user.

        requestsmock.get(f"{rs_settings.REMOTE_SETTINGS_URL}/", json={"capabilities": {}})

        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings().check_config()
        assert "Invalid Remote Settings credentials" in str(exc)

        requestsmock.get(
            f"{rs_settings.REMOTE_SETTINGS_URL}/",
            json={
                "user": {"id": f"account:{rs_settings.REMOTE_SETTINGS_USERNAME}"},
                "capabilities": {
                    "signer": {
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

        # Collection should be writable.
        collection_url = (
            f"{rs_settings.REMOTE_SETTINGS_URL}/buckets/{rs_settings.REMOTE_SETTINGS_BUCKET_ID}"
            f"/collections/{rs_settings.REMOTE_SETTINGS_COLLECTION_ID}"
        )
        requestsmock.get(collection_url, json={"data": {}, "permissions": {}})
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings().check_config()
        assert (
            f"Remote Settings collection {rs_settings.REMOTE_SETTINGS_COLLECTION_ID} "
            "is not writable"
        ) in str(exc)

        requestsmock.get(
            collection_url,
            json={
                "data": {},
                "permissions": {"write": [f"account:{rs_settings.REMOTE_SETTINGS_USERNAME}"]},
            },
        )

        # Collection review should be explicitly disabled.
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings().check_config()
        assert (
            "Review was not disabled on Remote Settings collection "
            f"{rs_settings.REMOTE_SETTINGS_COLLECTION_ID}."
        ) in str(exc)

        requestsmock.get(
            f"{rs_settings.REMOTE_SETTINGS_URL}/",
            json={
                "user": {"id": f"account:{rs_settings.REMOTE_SETTINGS_USERNAME}"},
                "capabilities": {
                    "signer": {
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
                                    "collection": "normandy-recipes",
                                },
                                "destination": {
                                    "bucket": "main",
                                    "collection": "normandy-recipes",
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

    def test_publish_puts_record_and_approves(self, rs_settings, requestsmock, mock_logger):
        """Test that requests are sent to Remote Settings on publish."""

        recipe = RecipeFactory(name="Test", approver=UserFactory())
        collection_url = (
            f"{rs_settings.REMOTE_SETTINGS_URL}/buckets/{rs_settings.REMOTE_SETTINGS_BUCKET_ID}"
            f"/collections/{rs_settings.REMOTE_SETTINGS_COLLECTION_ID}"
        )
        record_url = f"{collection_url}/records/{recipe.id}"
        auth = (
            rs_settings.REMOTE_SETTINGS_USERNAME + ":" + rs_settings.REMOTE_SETTINGS_PASSWORD
        ).encode()
        request_headers = {
            "User-Agent": KINTO_USER_AGENT,
            "Content-Type": "application/json",
            "Authorization": f"Basic {base64.b64encode(auth).decode()}",
        }
        requestsmock.request(
            "put", record_url, content=b'{"data": {}}', request_headers=request_headers
        )
        requestsmock.request(
            "patch", collection_url, content=b'{"data": {}}', request_headers=request_headers
        )

        remotesettings = exports.RemoteSettings()
        remotesettings.publish(recipe)

        assert len(requestsmock.request_history) == 2
        assert requestsmock.request_history[0].url == record_url
        assert requestsmock.request_history[0].json() == {"data": exports.recipe_as_record(recipe)}
        assert requestsmock.request_history[1].url == collection_url
        mock_logger.info.assert_called_with(
            f"Published record '{recipe.id}' for recipe '{recipe.name}'"
        )

    def test_unpublish_deletes_record_and_approves(self, rs_settings, requestsmock, mock_logger):
        """Test that requests are sent to Remote Settings on unpublish."""

        recipe = RecipeFactory(name="Test", approver=UserFactory())
        collection_url = (
            f"{rs_settings.REMOTE_SETTINGS_URL}/buckets/{rs_settings.REMOTE_SETTINGS_BUCKET_ID}"
            f"/collections/{rs_settings.REMOTE_SETTINGS_COLLECTION_ID}"
        )
        record_url = f"{collection_url}/records/{recipe.id}"
        auth = (
            rs_settings.REMOTE_SETTINGS_USERNAME + ":" + rs_settings.REMOTE_SETTINGS_PASSWORD
        ).encode()
        request_headers = {
            "User-Agent": KINTO_USER_AGENT,
            "Content-Type": "application/json",
            "Authorization": f"Basic {base64.b64encode(auth).decode()}",
        }
        requestsmock.request(
            "delete", record_url, content=b'{"data": {}}', request_headers=request_headers
        )
        requestsmock.request(
            "patch", collection_url, content=b'{"data": {}}', request_headers=request_headers
        )

        remotesettings = exports.RemoteSettings()
        remotesettings.unpublish(recipe)

        assert len(requestsmock.request_history) == 2
        assert requestsmock.request_history[0].url == record_url
        assert requestsmock.request_history[1].url == collection_url
        mock_logger.info.assert_called_with(
            f"Deleted record '{recipe.id}' of recipe '{recipe.name}'"
        )

    def test_publish_raises_an_error_if_request_fails(self, rs_settings, requestsmock):
        recipe = RecipeFactory(name="Test", approver=UserFactory())
        record_url = (
            f"{rs_settings.REMOTE_SETTINGS_URL}/buckets/{rs_settings.REMOTE_SETTINGS_BUCKET_ID}"
            f"/collections/{rs_settings.REMOTE_SETTINGS_COLLECTION_ID}"
            f"/records/{recipe.id}"
        )
        requestsmock.request("put", record_url, status_code=503)

        remotesettings = exports.RemoteSettings()
        with pytest.raises(kinto_http.KintoException):
            remotesettings.publish(recipe)

        assert requestsmock.call_count == rs_settings.REMOTE_SETTINGS_RETRY_REQUESTS + 1

    def test_unpublish_ignores_error_about_missing_record(
        self, rs_settings, requestsmock, mock_logger
    ):
        recipe = RecipeFactory(name="Test", approver=UserFactory())
        record_url = (
            f"{rs_settings.REMOTE_SETTINGS_URL}/buckets/{rs_settings.REMOTE_SETTINGS_BUCKET_ID}"
            f"/collections/{rs_settings.REMOTE_SETTINGS_COLLECTION_ID}"
            f"/records/{recipe.id}"
        )
        requestsmock.request("delete", record_url, status_code=404)

        remotesettings = exports.RemoteSettings()
        # Assert doesn't raise.
        remotesettings.unpublish(recipe)

        assert requestsmock.call_count == 1
        mock_logger.warning.assert_called_with(
            f"The recipe '{recipe.id}' was never published. Skip."
        )

    def test_publish_reverts_changes_if_approval_fails(self, rs_settings, requestsmock):
        recipe = RecipeFactory(name="Test", approver=UserFactory())
        collection_url = (
            f"{rs_settings.REMOTE_SETTINGS_URL}/buckets/{rs_settings.REMOTE_SETTINGS_BUCKET_ID}"
            f"/collections/{rs_settings.REMOTE_SETTINGS_COLLECTION_ID}"
        )
        record_url = f"{collection_url}/records/{recipe.id}"
        requestsmock.request("put", record_url, content=b'{"data": {}}', status_code=201)
        requestsmock.request("patch", collection_url, status_code=403)
        record_prod_url = record_url.replace(
            f"/buckets/{rs_settings.REMOTE_SETTINGS_BUCKET_ID}/",
            f"/buckets/{exports.RemoteSettings.MAIN_BUCKET_ID}/",
        )
        requestsmock.request("get", record_prod_url, content=b"{}", status_code=404)
        requestsmock.request("delete", record_url, content=b'{"data": {"deleted":true}}')

        remotesettings = exports.RemoteSettings()
        with pytest.raises(kinto_http.KintoException):
            remotesettings.publish(recipe)

        assert len(requestsmock.request_history) == 4
        assert requestsmock.request_history[0].url == record_url
        assert requestsmock.request_history[1].url == collection_url
        assert requestsmock.request_history[2].url == record_prod_url
        assert requestsmock.request_history[3].url == record_url
        assert requestsmock.request_history[3].method == "DELETE"

    def test_unpublish_reverts_changes_if_approval_fails(self, rs_settings, requestsmock):
        recipe = RecipeFactory(name="Test", approver=UserFactory())
        collection_url = (
            f"{rs_settings.REMOTE_SETTINGS_URL}/buckets/{rs_settings.REMOTE_SETTINGS_BUCKET_ID}"
            f"/collections/{rs_settings.REMOTE_SETTINGS_COLLECTION_ID}"
        )
        record_url = f"{collection_url}/records/{recipe.id}"
        requestsmock.request("delete", record_url, content=b'{"data": {"deleted":true}}')
        requestsmock.request("patch", collection_url, status_code=403)
        record_prod_url = record_url.replace(
            f"/buckets/{rs_settings.REMOTE_SETTINGS_BUCKET_ID}/",
            f"/buckets/{exports.RemoteSettings.MAIN_BUCKET_ID}/",
        )
        record_in_prod = json.dumps({"data": exports.recipe_as_record(recipe)}).encode()
        requestsmock.request("get", record_prod_url, content=record_in_prod)
        requestsmock.request("put", record_url, content=b'{"data": {}}')

        remotesettings = exports.RemoteSettings()
        with pytest.raises(kinto_http.KintoException):
            remotesettings.unpublish(recipe)

        assert len(requestsmock.request_history) == 4
        assert requestsmock.request_history[0].url == record_url
        assert requestsmock.request_history[0].method == "DELETE"
        assert requestsmock.request_history[1].url == collection_url
        assert requestsmock.request_history[2].url == record_prod_url
        assert requestsmock.request_history[3].url == record_url
        assert requestsmock.request_history[3].method == "PUT"
        assert requestsmock.request_history[3].json()["data"]["name"] == "Test"
