from support.assertions import assert_valid_schema


def test_approval_request_read(conf, requests_session):
    response = requests_session.get(conf.getoption('server') + '/api/v3/approval_request/1/')
    assert response.status_code != 404
    assert_valid_schema(response.json(), 'normandy-schema.json')
