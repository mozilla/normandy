def test_index(client):
    assert client.get('/').status_code == 200
