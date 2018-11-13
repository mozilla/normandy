import json
from unittest import mock

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


@pytest.fixture
def mock_kinto_request(mocker):
    return mocker.patch("kinto_http.session.requests.request")


@pytest.mark.django_db
class TestRemoteSettings(object):
    test_settings = {
        "URL": "https://remotesettings.example.com/v1",
        "USERNAME": "normandy",
        "PASSWORD": "n0rm4ndy",
    }

    def test_default_settings(self, settings):
        """Test default settings values."""

        assert not settings.REMOTE_SETTINGS_ENABLED
        assert settings.REMOTE_SETTINGS_COLLECTION_ID == "normandy-recipes"

    def test_it_checks_settings(self, settings):
        """Test that each required key is required individually"""

        # Leave out URL with Remote Settings disabled (default)
        settings.REMOTE_SETTINGS_URL = None
        # assert doesn't raise
        exports.RemoteSettings()

        # Enable the feature.
        settings.REMOTE_SETTINGS_ENABLED = True

        # Leave out URL
        settings.REMOTE_SETTINGS_URL = None
        settings.REMOTE_SETTINGS_USERNAME = self.test_settings["USERNAME"]
        settings.REMOTE_SETTINGS_PASSWORD = self.test_settings["PASSWORD"]
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings()
        assert "REMOTE_SETTINGS_URL" in str(exc)

        # Leave out USERNAME
        settings.REMOTE_SETTINGS_URL = self.test_settings["URL"]
        settings.REMOTE_SETTINGS_USERNAME = None
        settings.REMOTE_SETTINGS_PASSWORD = self.test_settings["PASSWORD"]
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings()
        assert "REMOTE_SETTINGS_USERNAME" in str(exc)

        # Leave out PASSWORD
        settings.REMOTE_SETTINGS_URL = self.test_settings["URL"]
        settings.REMOTE_SETTINGS_USERNAME = self.test_settings["USERNAME"]
        settings.REMOTE_SETTINGS_PASSWORD = None
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings()
        assert "REMOTE_SETTINGS_PASSWORD" in str(exc)

        # Leave out COLLECTION_ID
        settings.REMOTE_SETTINGS_URL = self.test_settings["URL"]
        settings.REMOTE_SETTINGS_USERNAME = self.test_settings["USERNAME"]
        settings.REMOTE_SETTINGS_PASSWORD = self.test_settings["PASSWORD"]
        settings.REMOTE_SETTINGS_COLLECTION_ID = None
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings()
        assert "REMOTE_SETTINGS_COLLECTION_ID" in str(exc)

        # Include everything
        settings.REMOTE_SETTINGS_URL = self.test_settings["URL"]
        settings.REMOTE_SETTINGS_USERNAME = self.test_settings["USERNAME"]
        settings.REMOTE_SETTINGS_PASSWORD = self.test_settings["PASSWORD"]
        settings.REMOTE_SETTINGS_COLLECTION_ID = "normandy-recipes"
        # assert doesn't raise
        exports.RemoteSettings()

    def test_publish_puts_record_and_approves(self, settings, mock_logger, mock_kinto_request):
        """Test that requests are sent to Remote Settings on publish."""

        settings.REMOTE_SETTINGS_URL = self.test_settings["URL"]
        settings.REMOTE_SETTINGS_USERNAME = self.test_settings["USERNAME"]
        settings.REMOTE_SETTINGS_PASSWORD = self.test_settings["PASSWORD"]

        mock_kinto_request.return_value = mock.MagicMock(status_code=200)
        recipe = RecipeFactory(name="Test", approver=UserFactory(), enabler=UserFactory())

        remotesettings = exports.RemoteSettings()
        remotesettings.publish(recipe)

        auth = (settings.REMOTE_SETTINGS_USERNAME, settings.REMOTE_SETTINGS_PASSWORD)
        headers = {"User-Agent": KINTO_USER_AGENT, "Content-Type": "application/json"}
        url = settings.REMOTE_SETTINGS_URL + "/buckets/main-workspace/collections/normandy-recipes"
        record_url = url + "/records/" + str(recipe.id)

        # Assert the correct request was made
        payload = json.dumps({"data": exports.recipe_as_record(recipe)})

        assert mock_kinto_request.call_count == 2
        mock_kinto_request.assert_any_call(
            "put", record_url, data=payload, auth=auth, headers=headers
        )
        mock_kinto_request.assert_any_call(
            "patch", url, data='{"data": {"status": "to-sign"}}', auth=auth, headers=headers
        )
        mock_logger.info.assert_called_with(
            f"Published record '{recipe.id}' for recipe {recipe.name}"
        )

    def test_unpublish_deletes_record_and_approves(
        self, settings, mock_kinto_request, mock_logger
    ):
        """Test that requests are sent to Remote Settings on unpublish."""

        settings.REMOTE_SETTINGS_URL = self.test_settings["URL"]
        settings.REMOTE_SETTINGS_USERNAME = self.test_settings["USERNAME"]
        settings.REMOTE_SETTINGS_PASSWORD = self.test_settings["PASSWORD"]

        mock_kinto_request.return_value = mock.MagicMock(status_code=200)
        recipe = RecipeFactory(name="Test", approver=UserFactory())

        remotesettings = exports.RemoteSettings()
        remotesettings.unpublish(recipe)

        auth = (settings.REMOTE_SETTINGS_USERNAME, settings.REMOTE_SETTINGS_PASSWORD)
        headers = {"User-Agent": KINTO_USER_AGENT, "Content-Type": "application/json"}
        url = settings.REMOTE_SETTINGS_URL + "/buckets/main-workspace/collections/normandy-recipes"
        record_url = url + "/records/" + str(recipe.id)

        assert mock_kinto_request.call_count == 2
        mock_kinto_request.assert_any_call(
            "delete", record_url, data="{}", auth=auth, headers=headers
        )
        mock_kinto_request.assert_any_call(
            "patch", url, data='{"data": {"status": "to-sign"}}', auth=auth, headers=headers
        )
        mock_logger.info.assert_called_with(
            f"Deleted record '{recipe.id}' of recipe {recipe.name}"
        )

    def test_publish_raises_an_error_if_request_fails(self, settings, mock_kinto_request):
        settings.REMOTE_SETTINGS_URL = self.test_settings["URL"]
        settings.REMOTE_SETTINGS_USERNAME = self.test_settings["USERNAME"]
        settings.REMOTE_SETTINGS_PASSWORD = self.test_settings["PASSWORD"]

        mock_kinto_request.return_value = mock.MagicMock(status_code=503)
        recipe = RecipeFactory(name="Test", approver=UserFactory())

        remotesettings = exports.RemoteSettings()
        with pytest.raises(kinto_http.KintoException):
            remotesettings.publish(recipe)

        assert mock_kinto_request.call_count == 4  # retried thrice.

    def test_unpublish_ignores_error_about_missing_record(
        self, settings, mock_kinto_request, mock_logger
    ):
        settings.REMOTE_SETTINGS_URL = self.test_settings["URL"]
        settings.REMOTE_SETTINGS_USERNAME = self.test_settings["USERNAME"]
        settings.REMOTE_SETTINGS_PASSWORD = self.test_settings["PASSWORD"]

        mock_kinto_request.return_value = mock.MagicMock(status_code=404)
        recipe = RecipeFactory(name="Test", approver=UserFactory())

        remotesettings = exports.RemoteSettings()

        # Assert doesn't raise.
        remotesettings.unpublish(recipe)

        assert mock_kinto_request.call_count == 1
        mock_logger.warning.assert_called_with(
            f"The recipe '{recipe.id}' was never published. Skip."
        )
