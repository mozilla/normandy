import pytest
import uuid

from support.assertions import assert_valid_schema
from urllib.parse import urljoin


def test_user_read(conf, requests_session, headers):
    # Get a list of users and use the ID of the first one
    response = requests_session.get(
        urljoin(conf.getoption("server"), "/api/v3/user/"),
        headers=headers
    )
    assert response.status_code == 200
    assert_valid_schema(response.json())
    user_id = response.json()['results'][0]['id']
    email = response.json()['results'][0]['email']

    # Retrieve the record associated with that ID and verify it matches
    response = requests_session.get(
        urljoin(conf.getoption("server"), "/api/v3/user/{}/".format(user_id)),
        headers=headers
    )
    assert response.status_code == 200
    assert_valid_schema(response.json())
    assert user_id == response.json()['id']
    assert email == response.json()['email']
