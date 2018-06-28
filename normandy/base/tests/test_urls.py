def test_slash_redirects_have_cache_control_headers(client, settings):
    res = client.get("/api/v2")
    assert res.status_code == 301
    assert "Location" in res
    # It isn't important to assert a particular value for max-age
    assert "max-age=" in res["Cache-Control"]
    assert "public" in res["Cache-Control"]
