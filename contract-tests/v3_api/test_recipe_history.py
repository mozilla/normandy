from random import *
from support.assertions import assert_valid_schema


def test_approval_request_read(conf, requests_session):
    # Get the ID of a random recipe and grab it's history
    response = requests_session.get(conf.getoption('server') + '/api/v3/recipe/')
    data = response.json()
    idx = randint(0, len(data['results'])-1)
    id = data['results'][idx]['id']
    response = requests_session.get(conf.getoption('server') + '/api/v3/recipe/{}/history/'.format(id))
    assert response.status_code != 404
    assert_valid_schema(response.json())
