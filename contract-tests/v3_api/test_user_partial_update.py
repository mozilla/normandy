from faker import Faker
from support.assertions import assert_valid_schema
from support.helpers import create_new_user
from urllib.parse import urljoin


def test_user_partial_update(conf, requests_session, headers):
    # Create a new user
    user_data = create_new_user(requests_session, conf.getoption("server"), headers)

    # Update the user's first name
    fake = Faker()
    updated_data = {"first_name": fake.first_name()}
    response = requests_session.patch(
        urljoin(conf.getoption("server"), "/api/v3/user/{}/".format(user_data["id"])),
        headers=headers,
        data=updated_data,
    )
    assert response.status_code == 200
    assert_valid_schema(response.json())

    # Verify they match our expected values
    response = requests_session.get(
        urljoin(conf.getoption("server"), "/api/v3/user/{}".format(user_data["id"])),
        headers=headers,
    )
    assert response.status_code == 200
    assert_valid_schema(response.json())
    assert updated_data["first_name"] == response.json()["first_name"]
