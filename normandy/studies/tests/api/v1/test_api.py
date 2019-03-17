import pytest

from normandy.studies.tests import ExtensionFactory, XPIFileFactory


@pytest.mark.django_db
class TestExtensionAPI(object):
    def test_it_works(self, api_client):
        res = api_client.get("/api/v1/extension/")
        assert res.status_code == 204

    def test_detail_view_includes_cache_headers(self, api_client, storage):
        extension = ExtensionFactory()
        res = api_client.get("/api/v1/extension/{id}/".format(id=extension.id))
        assert res.status_code == 200
        # It isn't important to assert a particular value for max-age
        assert "max-age=" in res["Cache-Control"]
        assert "public" in res["Cache-Control"]

    def test_list_sets_no_cookies(self, api_client):
        res = api_client.get("/api/v1/extension/")
        assert res.status_code == 204
        assert "Cookies" not in res

    def test_detail_sets_no_cookies(self, api_client, storage):
        extension = ExtensionFactory()
        res = api_client.get("/api/v1/extension/{id}/".format(id=extension.id))
        assert res.status_code == 200
        assert res.client.cookies == {}

    def test_read_only(self, api_client, storage):
        xpi = XPIFileFactory()
        with open(xpi.path, "rb") as f:
            res = api_client.post(
                "/api/v1/extension/", {"name": "test extension", "xpi": f}, format="multipart"
            )
        assert res.status_code == 405
