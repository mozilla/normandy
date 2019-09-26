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
        rv = {
            "workspace": {"capabilities": {}, "baseline": {}},
            "publish": {"capabilities": {}, "baseline": {}},
        }
        rv["workspace"]["baseline"]["collection"] = (
            f"{rs_settings.REMOTE_SETTINGS_URL}"
            f"/buckets/{rs_settings.REMOTE_SETTINGS_WORKSPACE_BUCKET_ID}"
            f"/collections/{rs_settings.REMOTE_SETTINGS_BASELINE_COLLECTION_ID}"
        )
        rv["workspace"]["capabilities"]["collection"] = (
            f"{rs_settings.REMOTE_SETTINGS_URL}"
            f"/buckets/{rs_settings.REMOTE_SETTINGS_WORKSPACE_BUCKET_ID}"
            f"/collections/{rs_settings.REMOTE_SETTINGS_CAPABILITIES_COLLECTION_ID}"
        )
        rv["publish"]["baseline"]["collection"] = (
            f"{rs_settings.REMOTE_SETTINGS_URL}"
            f"/buckets/{rs_settings.REMOTE_SETTINGS_PUBLISH_BUCKET_ID}"
            f"/collections/{rs_settings.REMOTE_SETTINGS_BASELINE_COLLECTION_ID}"
        )
        rv["publish"]["capabilities"]["collection"] = (
            f"{rs_settings.REMOTE_SETTINGS_URL}"
            f"/buckets/{rs_settings.REMOTE_SETTINGS_PUBLISH_BUCKET_ID}"
            f"/collections/{rs_settings.REMOTE_SETTINGS_CAPABILITIES_COLLECTION_ID}"
        )

        for bucket in ["workspace", "publish"]:
            for collection in ["baseline", "capabilities"]:
                rv[bucket][collection]["records"] = (
                    rv[bucket][collection]["collection"] + "/records"
                )
                rv[bucket][collection]["record"] = (
                    rv[bucket][collection]["collection"] + "/records/{}"
                )

        return rv

    def test_default_settings(self, settings):
        """Test default settings values."""

        assert settings.REMOTE_SETTINGS_URL is None
        assert settings.REMOTE_SETTINGS_USERNAME is None
        assert settings.REMOTE_SETTINGS_PASSWORD is None
        assert settings.REMOTE_SETTINGS_WORKSPACE_BUCKET_ID == "main-workspace"
        assert settings.REMOTE_SETTINGS_PUBLISH_BUCKET_ID == "main"
        assert settings.REMOTE_SETTINGS_BASELINE_COLLECTION_ID == "normandy-recipes"
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

        # Leave out BASELINE_COLLECTION_ID
        settings.REMOTE_SETTINGS_URL = "http://some-server/v1"
        settings.REMOTE_SETTINGS_USERNAME = "usename"
        settings.REMOTE_SETTINGS_PASSWORD = "p4ssw0rd"
        settings.REMOTE_SETTINGS_BASELINE_COLLECTION_ID = None
        settings.REMOTE_SETTINGS_CAPABILITIES_COLLECTION_ID = "normandy-recipes-capabilities"
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings().check_config()
        assert "REMOTE_SETTINGS_BASELINE_COLLECTION_ID" in str(exc.value)

        # Leave out CAPABILITIES_COLLECTION_ID
        settings.REMOTE_SETTINGS_URL = "http://some-server/v1"
        settings.REMOTE_SETTINGS_USERNAME = "usename"
        settings.REMOTE_SETTINGS_PASSWORD = "p4ssw0rd"
        settings.REMOTE_SETTINGS_BASELINE_COLLECTION_ID = "normandy-recipes"
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

        # Workspace collections should be writable
        bucket_collection_pairs = [
            (
                rs_settings.REMOTE_SETTINGS_WORKSPACE_BUCKET_ID,
                rs_settings.REMOTE_SETTINGS_BASELINE_COLLECTION_ID,
            ),
            (
                rs_settings.REMOTE_SETTINGS_WORKSPACE_BUCKET_ID,
                rs_settings.REMOTE_SETTINGS_CAPABILITIES_COLLECTION_ID,
            ),
        ]
        # Allow writes for all collections
        allow_write_payload = {
            "data": {},
            "permissions": {"write": [f"account:{rs_settings.REMOTE_SETTINGS_USERNAME}"]},
        }
        readonly_payload = {"data": {}, "permissions": {}}
        for bucket, collection in bucket_collection_pairs:
            collection_url = (
                f"{rs_settings.REMOTE_SETTINGS_URL}/buckets/{bucket}/collections/{collection}"
            )
            requestsmock.get(collection_url, json=allow_write_payload)

        for bucket, collection in bucket_collection_pairs:
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

        # Baseline collection review should be explicitly disabled.
        with pytest.raises(ImproperlyConfigured) as exc:
            exports.RemoteSettings().check_config()
        assert (
            "Review was not disabled on Remote Settings collection "
            f"{rs_settings.REMOTE_SETTINGS_BASELINE_COLLECTION_ID}."
        ) in str(exc.value)

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

        # Capabilities collection review should be explicitly disabled.
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
                "action": recipe.action.name,
                "arguments": recipe.arguments,
                "filter_expression": recipe.filter_expression,
                "id": recipe.id,
                "name": recipe.name,
                "revision_id": str(recipe.revision_id),
                "capabilities": Whatever(lambda caps: set(caps) == recipe.capabilities),
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
        rs_settings.BASELINE_CAPABILITIES |= recipe.capabilities

        auth = (
            rs_settings.REMOTE_SETTINGS_USERNAME + ":" + rs_settings.REMOTE_SETTINGS_PASSWORD
        ).encode()
        request_headers = {
            "User-Agent": KINTO_USER_AGENT,
            "Content-Type": "application/json",
            "Authorization": f"Basic {base64.b64encode(auth).decode()}",
        }

        for collection in ["baseline", "capabilities"]:
            requestsmock.request(
                "PUT",
                rs_urls["workspace"][collection]["record"].format(recipe.id),
                json={"data": {}},
                request_headers=request_headers,
            )
            requestsmock.request(
                "PATCH",
                rs_urls["workspace"][collection]["collection"],
                json={"data": {}},
                request_headers=request_headers,
            )

        remotesettings = exports.RemoteSettings()
        remotesettings.publish(recipe)

        requests = requestsmock.request_history
        assert len(requests) == 4
        assert requests[0].url == rs_urls["workspace"]["capabilities"]["record"].format(recipe.id)
        assert requests[0].method == "PUT"
        assert requests[0].json() == {"data": exports.recipe_as_record(recipe)}
        assert requests[1].url == rs_urls["workspace"]["baseline"]["record"].format(recipe.id)
        assert requests[1].method == "PUT"
        assert requests[1].json() == {"data": exports.recipe_as_record(recipe)}
        assert requests[2].method == "PATCH"
        assert requests[2].url == rs_urls["workspace"]["capabilities"]["collection"]
        assert requests[3].method == "PATCH"
        assert requests[3].url == rs_urls["workspace"]["baseline"]["collection"]
        mock_logger.info.assert_called_with(
            f"Published record '{recipe.id}' for recipe '{recipe.name}'"
        )

    def test_unpublish_deletes_record_and_approves(
        self, rs_urls, rs_settings, requestsmock, mock_logger
    ):
        """Test that requests are sent to Remote Settings on unpublish."""

        recipe = RecipeFactory(name="Test", approver=UserFactory())
        rs_settings.BASELINE_CAPABILITIES |= recipe.capabilities
        urls = rs_urls["workspace"]

        auth = (
            rs_settings.REMOTE_SETTINGS_USERNAME + ":" + rs_settings.REMOTE_SETTINGS_PASSWORD
        ).encode()
        request_headers = {
            "User-Agent": KINTO_USER_AGENT,
            "Content-Type": "application/json",
            "Authorization": f"Basic {base64.b64encode(auth).decode()}",
        }
        for collection in ["baseline", "capabilities"]:
            requestsmock.request(
                "delete",
                urls[collection]["record"].format(recipe.id),
                json={"data": {}},
                request_headers=request_headers,
            )
            requestsmock.request(
                "patch",
                urls[collection]["collection"],
                json={"data": {}},
                request_headers=request_headers,
            )

        remotesettings = exports.RemoteSettings()
        remotesettings.unpublish(recipe)

        assert len(requestsmock.request_history) == 4
        requests = requestsmock.request_history
        assert requests[0].url == urls["capabilities"]["record"].format(recipe.id)
        assert requests[0].method == "DELETE"
        assert requests[1].url == urls["baseline"]["record"].format(recipe.id)
        assert requests[1].method == "DELETE"
        assert requests[2].url == urls["capabilities"]["collection"]
        assert requests[2].method == "PATCH"
        assert requests[3].url == urls["baseline"]["collection"]
        assert requests[3].method == "PATCH"
        mock_logger.info.assert_called_with(
            f"Deleted record '{recipe.id}' of recipe '{recipe.name}'"
        )

    def test_publish_raises_an_error_if_request_fails(self, rs_urls, rs_settings, requestsmock):
        recipe = RecipeFactory(name="Test", approver=UserFactory())
        record_url = rs_urls["workspace"]["capabilities"]["record"].format(recipe.id)
        requestsmock.request("put", record_url, status_code=503)

        remotesettings = exports.RemoteSettings()
        with pytest.raises(kinto_http.KintoException):
            remotesettings.publish(recipe)

        assert requestsmock.call_count == rs_settings.REMOTE_SETTINGS_RETRY_REQUESTS + 1

    def test_unpublish_ignores_error_about_missing_records(
        self, rs_urls, rs_settings, requestsmock, mock_logger
    ):
        recipe = RecipeFactory(name="Test", approver=UserFactory())
        baseline_record_url = rs_urls["workspace"]["baseline"]["record"].format(recipe.id)
        capabilities_record_url = rs_urls["workspace"]["capabilities"]["record"].format(recipe.id)
        warning_message = (
            f"The recipe '{recipe.id}' was not published in the {{}} collection. Skip."
        )

        requestsmock.request("delete", baseline_record_url, status_code=404)
        requestsmock.request("delete", capabilities_record_url, status_code=404)
        remotesettings = exports.RemoteSettings()
        # Assert doesn't raise.
        remotesettings.unpublish(recipe)
        assert mock_logger.warning.call_args_list == [
            call(warning_message.format("capabilities")),
            call(warning_message.format("baseline")),
        ]

    def test_publish_reverts_changes_if_approval_fails(self, rs_urls, rs_settings, requestsmock):
        # This test forces the recipe to not use baseline capabilities to
        # simplify the test. This simplifies the test.
        recipe = RecipeFactory(name="Test", approver=UserFactory())
        assert not recipe.uses_only_baseline_capabilities()
        record = exports.recipe_as_record(recipe)
        unchanged = exports.recipe_as_record(
            RecipeFactory(name="Unchanged", approver=UserFactory())
        )

        capabilities_record_url = rs_urls["workspace"]["capabilities"]["record"].format(recipe.id)
        # Creating the record works.
        requestsmock.request("put", capabilities_record_url, json={"data": {}}, status_code=201)
        # Approving fails.
        requestsmock.request(
            "patch", rs_urls["workspace"]["capabilities"]["collection"], status_code=403
        )
        # Simulate that the record exists in workspace but not in main
        requestsmock.request(
            "get",
            rs_urls["workspace"]["capabilities"]["records"],
            json={"data": [unchanged, record]},
        )
        requestsmock.request(
            "get", rs_urls["publish"]["capabilities"]["records"], json={"data": [unchanged]}
        )
        # And nothing exists in the baseline collection
        requestsmock.request("get", rs_urls["workspace"]["baseline"]["records"], json={"data": []})
        requestsmock.request("get", rs_urls["publish"]["baseline"]["records"], json={"data": []})
        # Reverting changes means deleting this record.
        requestsmock.request("delete", capabilities_record_url, json={"data": {"deleted": True}})

        remotesettings = exports.RemoteSettings()
        with pytest.raises(kinto_http.KintoException):
            remotesettings.publish(recipe)

        requests = requestsmock.request_history
        assert len(requests) == 5
        # First it publishes a recipe
        assert requests[0].method == "PUT"
        assert requests[0].url == capabilities_record_url
        # and then tries to approve it, which fails.
        assert requests[1].method == "PATCH"
        assert requests[1].url == rs_urls["workspace"]["capabilities"]["collection"]
        # It gets the state of all the collections
        assert requests[2].method == "GET"
        assert requests[2].url == rs_urls["workspace"]["capabilities"]["records"]
        assert requests[3].method == "GET"
        assert requests[3].url == rs_urls["publish"]["capabilities"]["records"]
        # And then deletes the record published in request 0
        assert requests[4].method == "DELETE"
        assert requests[4].url == capabilities_record_url

    def test_unpublish_reverts_changes_if_approval_fails(self, rs_urls, rs_settings, requestsmock):
        recipe = RecipeFactory(name="Test", approver=UserFactory())
        record = exports.recipe_as_record(recipe)
        unchanged = exports.recipe_as_record(
            RecipeFactory(name="Unchanged", approver=UserFactory())
        )
        baseline_record_url = rs_urls["workspace"]["baseline"]["record"].format(recipe.id)
        capabilities_record_url = rs_urls["workspace"]["capabilities"]["record"].format(recipe.id)
        # Deleting the record works.
        requestsmock.request("delete", baseline_record_url, json={"data": {"deleted": True}})
        requestsmock.request("delete", capabilities_record_url, json={"data": {"deleted": True}})
        # Approving fails.
        requestsmock.request(
            "patch",
            rs_urls["workspace"]["capabilities"]["collection"],
            status_code=403,
            json={"data": {}},
        )
        # Simulate that the record exists in prod but not in workspace, and not in the baseline collection
        requestsmock.request(
            "get", rs_urls["workspace"]["capabilities"]["records"], json={"data": [unchanged]}
        )
        requestsmock.request(
            "get",
            rs_urls["publish"]["capabilities"]["records"],
            json={"data": [unchanged, record]},
        )
        for bucket in ["workspace", "publish"]:
            requestsmock.request("get", rs_urls[bucket]["baseline"]["records"], json={"data": []})
        # Reverting changes means recreating this record.
        requestsmock.request("put", capabilities_record_url, json={"data": {}})

        remotesettings = exports.RemoteSettings()
        with pytest.raises(kinto_http.KintoException):
            remotesettings.unpublish(recipe)

        requests = requestsmock.request_history
        assert len(requests) == 8
        # Unpublish the recipe in both collections
        assert requests[0].url == capabilities_record_url
        assert requests[0].method == "DELETE"
        assert requests[1].url == baseline_record_url
        assert requests[1].method == "DELETE"
        # Try (and fail) to approve the capabilities change
        assert requests[2].url == rs_urls["workspace"]["capabilities"]["collection"]
        assert requests[2].method == "PATCH"
        # Get the state of the capabilities collection
        assert requests[3].url == rs_urls["workspace"]["capabilities"]["records"]
        assert requests[3].method == "GET"
        assert requests[4].url == rs_urls["publish"]["capabilities"]["records"]
        assert requests[4].method == "GET"
        # Fix the capabilities collection
        assert requests[5].url == capabilities_record_url
        assert requests[5].method == "PUT"
        # Get the state of the baseline collection
        assert requests[6].url == rs_urls["workspace"]["baseline"]["records"]
        assert requests[6].method == "GET"
        assert requests[7].url == rs_urls["publish"]["baseline"]["records"]
        assert requests[7].method == "GET"

        submitted = requests[5].json()
        assert submitted["data"]["id"] == str(recipe.id)
        assert submitted["data"]["recipe"]["name"] == recipe.name

    def test_publish_and_unpublish_baseline_recipe_to_both_collections(
        self, rs_settings, rs_urls, requestsmock
    ):
        ws_urls = rs_urls["workspace"]

        recipe = RecipeFactory()
        rs_settings.BASELINE_CAPABILITIES |= recipe.capabilities
        assert recipe.uses_only_baseline_capabilities()

        # Expect publish calls to both collections
        requestsmock.put(
            ws_urls["baseline"]["record"].format(recipe.id), json={"data": {}}, status_code=201
        )
        requestsmock.put(
            ws_urls["capabilities"]["record"].format(recipe.id), json={"data": {}}, status_code=201
        )
        # Expect both workspaces to be approved
        requestsmock.patch(ws_urls["baseline"]["collection"], json={"data": {}})
        requestsmock.patch(ws_urls["capabilities"]["collection"], json={"data": {}})

        remotesettings = exports.RemoteSettings()
        remotesettings.publish(recipe)

        requests = requestsmock.request_history
        assert len(requests) == 4
        # First it publishes a recipe to both collections
        assert requests[0].method == "PUT"
        assert requests[0].url == ws_urls["capabilities"]["record"].format(recipe.id)
        assert requests[1].method == "PUT"
        assert requests[1].url == ws_urls["baseline"]["record"].format(recipe.id)
        # and then approves both changes
        assert requests[2].method == "PATCH"
        assert requests[2].url == rs_urls["workspace"]["capabilities"]["collection"]
        assert requests[3].method == "PATCH"
        assert requests[3].url == rs_urls["workspace"]["baseline"]["collection"]

        # reset request history
        requestsmock._adapter.request_history = []

        # Expect delete calls
        requestsmock.delete(ws_urls["baseline"]["record"].format(recipe.id), json={"data": {}})
        requestsmock.delete(ws_urls["capabilities"]["record"].format(recipe.id), json={"data": {}})

        remotesettings.unpublish(recipe)

        requests = requestsmock.request_history
        assert len(requests) == 4
        # First it removes the recipe from both collections
        assert requests[0].method == "DELETE"
        assert requests[0].url == ws_urls["capabilities"]["record"].format(recipe.id)
        assert requests[1].method == "DELETE"
        assert requests[1].url == ws_urls["baseline"]["record"].format(recipe.id)
        # and then approves both changes
        assert requests[2].method == "PATCH"
        assert requests[2].url == rs_urls["workspace"]["capabilities"]["collection"]
        assert requests[3].method == "PATCH"
        assert requests[3].url == rs_urls["workspace"]["baseline"]["collection"]

    def test_publish_and_unpublish_non_baseline_recipe_only_to_capabilities_collection(
        self, rs_settings, rs_urls, requestsmock
    ):
        ws_urls = rs_urls["workspace"]

        recipe = RecipeFactory()
        assert not recipe.uses_only_baseline_capabilities()

        # Expect calls only to the capabilities collection
        requestsmock.put(
            ws_urls["capabilities"]["record"].format(recipe.id), json={"data": {}}, status_code=201
        )
        requestsmock.patch(ws_urls["capabilities"]["collection"], json={"data": {}})

        remotesettings = exports.RemoteSettings()
        remotesettings.publish(recipe)

        requests = requestsmock.request_history
        assert len(requests) == 2
        # First it publishes the recipe
        assert requests[0].method == "PUT"
        assert requests[0].url == ws_urls["capabilities"]["record"].format(recipe.id)
        # and then approves the change
        assert requests[1].method == "PATCH"
        assert requests[1].url == rs_urls["workspace"]["capabilities"]["collection"]

        # reset request history
        requestsmock._adapter.request_history = []

        # Expect delete calls
        requestsmock.delete(ws_urls["capabilities"]["record"].format(recipe.id), json={"data": {}})
        # Baseline is expected, just in case the recipe changed from baseline to not baseline
        requestsmock.delete(ws_urls["baseline"]["record"].format(recipe.id), status_code=404)

        remotesettings.unpublish(recipe)

        requests = requestsmock.request_history
        assert len(requests) == 3
        # First it removes the recipe
        assert requests[0].method == "DELETE"
        assert requests[0].url == ws_urls["capabilities"]["record"].format(recipe.id)
        # Tries to delete from baseline, just in case
        assert requests[1].method == "DELETE"
        assert requests[1].url == ws_urls["baseline"]["record"].format(recipe.id)
        # and then approves the change only from capabilities
        assert requests[2].method == "PATCH"
        assert requests[2].url == rs_urls["workspace"]["capabilities"]["collection"]
