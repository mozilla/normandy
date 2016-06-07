def test_index(client):
    url = '/'
    assert client.get(url).status_code == 200
