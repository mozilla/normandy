from support.assertions import assert_valid_schema


def test_v3_action_read(conf, requests_session):
    response = requests_session.get(conf.getoption('server') + '/api/v3/action/2')
    assert response.status_code != 404
    assert_valid_schema(response.json(), 'normandy-schema.json')