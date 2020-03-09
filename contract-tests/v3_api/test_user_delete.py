import pytest
import uuid

from faker import Faker
from support.assertions import assert_valid_schema
from support.helpers import create_new_user
from urllib.parse import urljoin


def test_user_delete(conf, requests_session, headers):
    # Create a new user
    user_data = create_new_user(
        requests_session,
        conf.getoption("server"),
        headers
    )

    # Delete this user
    response = requests_session.delete(
        urljoin(conf.getoption("server"), "/api/v3/user/{}/".format(user_data['id'])),
        headers=headers,
    )
    assert response.status_code == 204

    # Verify the user no longer exists in the system
    response = requests_session.get(
        urljoin(conf.getoption("server"), "/api/v3/user/{}".format(user_data['id'])),
        headers=headers
    )
    assert response.status_code == 404

