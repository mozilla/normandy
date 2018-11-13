import base64

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
    test_settings = {
        "URL": "https://remotesettings.example.com/v1",
        "USERNAME": "normandy",
        "PASSWORD": "n0rm4ndy",
    }

    def test_default_settings(self, settings):
        """Test default settings values."""

        assert not settings.REMOTE_SETTINGS_ENABLED
        assert settings.REMOTE_SETTINGS_BUCKET_ID == "main-workspace"
        assert settings.REMOTE_SETTINGS_COLLECTION_ID == "normandy-recipes"
        assert settings.REMOTE_SETTINGS_RETRY_REQUESTS == 3

    def test_it_checks_settings(self, settings):
        """Test that each required key is required individually"""

        # Leave out URL with Remote Settings disabled (default)
        settings.REMOTE_SETTINGS_URL = None
        # assert doesn't raise
        exports.RemoteSettings().check_config()

        # Enable the feature.
        settings.REMOTE_SETTINGS_ENABLED = True

        # Leave out URL
        settings.REMOTE_SETTINGS_USERNAME = self.test_settings["USERNAME"]
        settings.REMOTE_SETTINGS_PASSWORD = self.test_settings["PASSWORD"]
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings().check_config()
        assert "REMOTE_SETTINGS_URL" in str(exc)

        # Set empty URL
        settings.REMOTE_SETTINGS_URL = ""
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings().check_config()
        assert "REMOTE_SETTINGS_URL" in str(exc)

        # Leave out USERNAME
        settings.REMOTE_SETTINGS_URL = self.test_settings["URL"]
        settings.REMOTE_SETTINGS_USERNAME = None
        settings.REMOTE_SETTINGS_PASSWORD = self.test_settings["PASSWORD"]
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings().check_config()
        assert "REMOTE_SETTINGS_USERNAME" in str(exc)

        # Leave out PASSWORD
        settings.REMOTE_SETTINGS_URL = self.test_settings["URL"]
        settings.REMOTE_SETTINGS_USERNAME = self.test_settings["USERNAME"]
        settings.REMOTE_SETTINGS_PASSWORD = None
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings().check_config()
        assert "REMOTE_SETTINGS_PASSWORD" in str(exc)

        # Leave out COLLECTION_ID
        settings.REMOTE_SETTINGS_URL = self.test_settings["URL"]
        settings.REMOTE_SETTINGS_USERNAME = self.test_settings["USERNAME"]
        settings.REMOTE_SETTINGS_PASSWORD = self.test_settings["PASSWORD"]
        settings.REMOTE_SETTINGS_COLLECTION_ID = None
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings().check_config()
        assert "REMOTE_SETTINGS_COLLECTION_ID" in str(exc)

    def test_check_connection(self, settings, requestsmock):
        settings.REMOTE_SETTINGS_ENABLED = True
        settings.REMOTE_SETTINGS_URL = self.test_settings["URL"]
        settings.REMOTE_SETTINGS_USERNAME = self.test_settings["USERNAME"]
        settings.REMOTE_SETTINGS_PASSWORD = self.test_settings["PASSWORD"]

        # Root URL should return currently authenticated user.
        requestsmock.get(f"{settings.REMOTE_SETTINGS_URL}/", json={})

        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings().check_config()
        assert "Invalid Remote Settings credentials" in str(exc)

        requestsmock.get(
            f"{settings.REMOTE_SETTINGS_URL}/",
            json={"user": {"id": f"account:{settings.REMOTE_SETTINGS_USERNAME}"}},
        )

        # Collection should be writable.
        collection_url = (
            f"{settings.REMOTE_SETTINGS_URL}/buckets/{settings.REMOTE_SETTINGS_BUCKET_ID}"
            f"/collections/{settings.REMOTE_SETTINGS_COLLECTION_ID}"
        )
        requestsmock.get(collection_url, json={"data": {}, "permissions": {}})
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings().check_config()
        assert (
            f"Remote Settings collection {settings.REMOTE_SETTINGS_COLLECTION_ID} is not writable"
            in str(exc)
        )

        requestsmock.get(
            collection_url,
            json={
                "data": {},
                "permissions": {"write": [f"account:{settings.REMOTE_SETTINGS_USERNAME}"]},
            },
        )

        # Review must be disabled on server for this collection.
        requestsmock.get(
            f"{settings.REMOTE_SETTINGS_URL}/",
            json={
                "user": {"id": f"account:{settings.REMOTE_SETTINGS_USERNAME}"},
                "capabilities": {"signer": {"resources": [{"source": {"bucket": "test"}}]}},
            },
        )
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings().check_config()
        assert f"Review was not disabled for {settings.REMOTE_SETTINGS_COLLECTION_ID}" in str(exc)

        requestsmock.get(
            f"{settings.REMOTE_SETTINGS_URL}/",
            json={
                "user": {"id": f"account:{settings.REMOTE_SETTINGS_USERNAME}"},
                "capabilities": {
                    "signer": {
                        "resources": [
                            {
                                "source": {
                                    "bucket": settings.REMOTE_SETTINGS_BUCKET_ID,
                                    "collection": settings.REMOTE_SETTINGS_COLLECTION_ID,
                                },
                                "to_review_enabled": False,
                                "group_check_enabled": False,
                            }
                        ]
                    }
                },
            },
        )

        # Assert does not raise.
        exports.RemoteSettings().check_config()

    def test_publish_puts_record_and_approves(self, settings, requestsmock, mock_logger):
        """Test that requests are sent to Remote Settings on publish."""

        settings.REMOTE_SETTINGS_URL = self.test_settings["URL"]
        settings.REMOTE_SETTINGS_USERNAME = self.test_settings["USERNAME"]
        settings.REMOTE_SETTINGS_PASSWORD = self.test_settings["PASSWORD"]

        recipe = RecipeFactory(name="Test", approver=UserFactory(), enabler=UserFactory())
        collection_url = (
            f"{settings.REMOTE_SETTINGS_URL}/buckets/{settings.REMOTE_SETTINGS_BUCKET_ID}"
            f"/collections/{settings.REMOTE_SETTINGS_COLLECTION_ID}"
        )
        record_url = f"{collection_url}/records/{recipe.id}"
        auth = f"{settings.REMOTE_SETTINGS_USERNAME}:{settings.REMOTE_SETTINGS_PASSWORD}".encode()
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
            f"Published record '{recipe.id}' for recipe {recipe.name}"
        )

    def test_unpublish_deletes_record_and_approves(self, settings, requestsmock, mock_logger):
        """Test that requests are sent to Remote Settings on unpublish."""

        settings.REMOTE_SETTINGS_URL = self.test_settings["URL"]
        settings.REMOTE_SETTINGS_USERNAME = self.test_settings["USERNAME"]
        settings.REMOTE_SETTINGS_PASSWORD = self.test_settings["PASSWORD"]

        recipe = RecipeFactory(name="Test", approver=UserFactory(), enabler=UserFactory())
        collection_url = (
            f"{settings.REMOTE_SETTINGS_URL}/buckets/{settings.REMOTE_SETTINGS_BUCKET_ID}"
            f"/collections/{settings.REMOTE_SETTINGS_COLLECTION_ID}"
        )
        record_url = f"{collection_url}/records/{recipe.id}"
        auth = f"{settings.REMOTE_SETTINGS_USERNAME}:{settings.REMOTE_SETTINGS_PASSWORD}".encode()
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
            f"Deleted record '{recipe.id}' of recipe {recipe.name}"
        )

    def test_publish_raises_an_error_if_request_fails(self, settings, requestsmock):
        settings.REMOTE_SETTINGS_URL = self.test_settings["URL"]
        settings.REMOTE_SETTINGS_USERNAME = self.test_settings["USERNAME"]
        settings.REMOTE_SETTINGS_PASSWORD = self.test_settings["PASSWORD"]

        recipe = RecipeFactory(name="Test", approver=UserFactory())
        record_url = (
            f"{settings.REMOTE_SETTINGS_URL}/buckets/{settings.REMOTE_SETTINGS_BUCKET_ID}"
            f"/collections/{settings.REMOTE_SETTINGS_COLLECTION_ID}"
            f"/records/{recipe.id}"
        )
        requestsmock.request("put", record_url, status_code=503)

        remotesettings = exports.RemoteSettings()
        with pytest.raises(kinto_http.KintoException):
            remotesettings.publish(recipe)

        assert requestsmock.call_count == 4  # retried thrice.

    def test_unpublish_ignores_error_about_missing_record(
        self, settings, requestsmock, mock_logger
    ):
        settings.REMOTE_SETTINGS_URL = self.test_settings["URL"]
        settings.REMOTE_SETTINGS_USERNAME = self.test_settings["USERNAME"]
        settings.REMOTE_SETTINGS_PASSWORD = self.test_settings["PASSWORD"]

        recipe = RecipeFactory(name="Test", approver=UserFactory())
        record_url = (
            f"{settings.REMOTE_SETTINGS_URL}/buckets/{settings.REMOTE_SETTINGS_BUCKET_ID}"
            f"/collections/{settings.REMOTE_SETTINGS_COLLECTION_ID}"
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
