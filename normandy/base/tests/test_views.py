import pytest

from normandy.base.tests import GQ, UserFactory


def test_index(client):
    response = client.get("/")
    assert response.status_code == 200


def test_api_notfound(client):
    response = client.get("/api/gooblygook/")
    assert response.status_code == 404
    assert "application/json" in response["content-type"]
    assert response.json()["path"] == "/api/gooblygook/"


@pytest.mark.django_db
class TestGraphQLView:
    # Note: most of the testing of GraphQL happens in normandy/base/tests/test_schema.py

    def test_basic_query(self, client):
        u = UserFactory()
        query = GQ().query.allUsers.fields("id")
        res = client.get(f"/api/graphql/?query={query}")
        assert res.json() == {"data": {"allUsers": [{"id": str(u.id)}]}}

    def test_get_includes_cache_headers(self, api_client):
        query = GQ().query.allUsers.fields("id")
        res = api_client.get(f"/api/graphql/?query={query}")
        assert res.status_code == 200
        assert "max-age=" in res["Cache-Control"]
        assert "public" in res["Cache-Control"]

    def test_post_explicit_no_cache(self, api_client):
        query = GQ().query.allUsers.fields("id")
        res = api_client.post(f"/api/graphql/?query={query}")
        assert res.status_code == 200
        assert "no-cache" in res["Cache-Control"]
