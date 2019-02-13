from urllib.parse import urlparse

import pytest
from pathlib import Path

from django.conf import settings

from normandy.base.tests import Whatever
from normandy.studies.tests import ExtensionFactory


@pytest.mark.django_db
class TestExtensionAPI(object):
    @classmethod
    def data_path(cls, file_name):
        return Path(settings.BASE_DIR) / "normandy/studies/tests/data" / file_name

    def test_it_works(self, api_client):
        res = api_client.get("/api/v1/extension/")
        assert res.status_code == 200
        assert res.data == []

    def test_it_serves_extensions(self, api_client, storage):
        extension = ExtensionFactory(name="foo")

        res = api_client.get("/api/v1/extension/")
        assert res.status_code == 200
        assert res.data == [
            {
                "id": extension.id,
                "name": "foo",
                "xpi": Whatever(),
                "extension_id": extension.extension_id,
                "version": extension.version,
                "hash": extension.hash,
                "hash_algorithm": extension.hash_algorithm,
            }
        ]

    def test_list_view_includes_cache_headers(self, api_client):
        res = api_client.get("/api/v1/extension/")
        assert res.status_code == 200
        # It isn't important to assert a particular value for max-age
        assert "max-age=" in res["Cache-Control"]
        assert "public" in res["Cache-Control"]

    def test_detail_view_includes_cache_headers(self, api_client, storage):
        extension = ExtensionFactory()
        res = api_client.get("/api/v1/extension/{id}/".format(id=extension.id))
        assert res.status_code == 200
        # It isn't important to assert a particular value for max-age
        assert "max-age=" in res["Cache-Control"]
        assert "public" in res["Cache-Control"]

    def test_list_sets_no_cookies(self, api_client):
        res = api_client.get("/api/v1/extension/")
        assert res.status_code == 200
        assert "Cookies" not in res

    def test_detail_sets_no_cookies(self, api_client, storage):
        extension = ExtensionFactory()
        res = api_client.get("/api/v1/extension/{id}/".format(id=extension.id))
        assert res.status_code == 200
        assert res.client.cookies == {}

    def test_filtering_by_name(self, api_client, storage):
        matching_extension = ExtensionFactory()
        ExtensionFactory()  # Generate another extension that will not match

        res = api_client.get(f"/api/v1/extension/?text={matching_extension.name}")
        assert res.status_code == 200
        assert [ext["name"] for ext in res.data] == [matching_extension.name]

    def test_filtering_by_xpi(self, api_client, storage):
        matching_extension = ExtensionFactory()
        ExtensionFactory()  # Generate another extension that will not match

        res = api_client.get(f"/api/v1/extension/?text={matching_extension.xpi}")
        assert res.status_code == 200
        expected_path = matching_extension.xpi.url
        assert [urlparse(ext["xpi"]).path for ext in res.data] == [expected_path]

    def test_read_only(self, api_client, storage):
        path = self.data_path("webext-signed.xpi")
        with open(path, "rb") as f:
            res = api_client.post(
                "/api/v1/extension/", {"name": "test extension", "xpi": f}, format="multipart"
            )
        assert res.status_code == 405

    def test_order_name(self, api_client, storage):
        e1 = ExtensionFactory(name="a")
        e2 = ExtensionFactory(name="b")

        res = api_client.get(f"/api/v1/extension/?ordering=name")
        assert res.status_code == 200
        assert [r["id"] for r in res.data] == [e1.id, e2.id]

        res = api_client.get(f"/api/v1/extension/?ordering=-name")
        assert res.status_code == 200
        assert [r["id"] for r in res.data] == [e2.id, e1.id]

    def test_order_id(self, api_client, storage):
        e1 = ExtensionFactory()
        e2 = ExtensionFactory()
        assert e1.id < e2.id

        res = api_client.get(f"/api/v1/extension/?ordering=id")
        assert res.status_code == 200
        assert [r["id"] for r in res.data] == [e1.id, e2.id]

        res = api_client.get(f"/api/v1/extension/?ordering=-id")
        assert res.status_code == 200
        assert [r["id"] for r in res.data] == [e2.id, e1.id]

    def test_order_bogus(self, api_client, storage):
        """Test that filtering by an unknown key doesn't change the sort order"""
        ExtensionFactory()
        ExtensionFactory()

        res = api_client.get(f"/api/v1/extension/?ordering=bogus")
        assert res.status_code == 200
        first_ordering = [r["id"] for r in res.data]

        res = api_client.get(f"/api/v1/extension/?ordering=-bogus")
        assert res.status_code == 200
        assert [r["id"] for r in res.data] == first_ordering
