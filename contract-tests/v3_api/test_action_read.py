from support.assertions import assert_valid_schema


def test_action_read(conf, requests_session):
    # Get the first action from the list and use it
    response = requests_session.get(conf.getoption("server") + "/api/v3/action/")
    data = response.json()
    action_id = data["results"][0]["id"]

    response = requests_session.get(
        conf.getoption("server") + "/api/v3/action/{}".format(action_id)
    )
    assert response.status_code != 404
    assert_valid_schema(response.json())
