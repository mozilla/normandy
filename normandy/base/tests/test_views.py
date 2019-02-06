def test_index(client):
    response = client.get("/")
    assert response.status_code == 200


def test_api_notfound(client):
    response = client.get("/api/gooblygook/")
    assert response.status_code == 404
    assert "application/json" in response["content-type"]
    assert response.json()["path"] == "/api/gooblygook/"
