from support.assertions import assert_valid_schema


def test_action_list(conf, requests_session):
    response = requests_session.get(conf.getoption("server") + "/api/v3/action/")
    assert response.status_code != 404
    assert_valid_schema(response.json())
