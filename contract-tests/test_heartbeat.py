from pytest_testrail.plugin import pytestrail


@pytestrail.case("C7114")
def test_heartbeat_is_ok(conf, requests_session):
    r = requests_session.get(conf.getoption("server") + "/__heartbeat__")
    # No r.raise_for_status() so we can check other things first
    response = r.json()

    # Verify there is at least one check being made
    assert len(response["checks"].keys()) > 0
    # This will give nice-ish errors if there are failing tests
    assert response["details"] == {}
    assert response["status"] == "ok"
    assert r.status_code == 200
