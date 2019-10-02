import requests

from support.assertions import assert_valid_schema


def test_v3_list(conf):
    response = requests.get(conf.getoption('server') + '/api/v3')
    assert response.status_code != 404
    assert_valid_schema(response.json(), 'normandy-schema.json')
