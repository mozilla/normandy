import requests

from support.assertions import assert_valid_schema


<<<<<<< HEAD
def test_v3_list(conf):
    response = requests.get(conf.getoption('server') + '/api/v3')
=======
def test_list(conf, requests_session):
    response = requests_session.get(conf.getoption("server") + "/api/v3")
>>>>>>> Linting fixes
    assert response.status_code != 404
    assert_valid_schema(response.json(), 'normandy-schema.json')
