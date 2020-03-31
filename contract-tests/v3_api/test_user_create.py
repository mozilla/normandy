from faker import Faker
from support.assertions import assert_valid_schema
from urllib.parse import urljoin


def test_user_create(conf, requests_session, headers):
    # Get a list of groups and grab the ID of the first one
    response = requests_session.get(
        urljoin(conf.getoption("server"), "/api/v3/group/"), headers=headers
    )
    assert response.status_code == 200
    assert_valid_schema(response.json())
    group_id = response.json()["results"][0]["id"]
    group_name = response.json()["results"][0]["name"]
    fake = Faker()

    # Create a user, assigning them to the group we obtained
    user_data = {
        "first_name": fake.first_name(),
        "last_name": fake.last_name(),
        "email": fake.company_email(),
        "groups": {"id": group_id, "name": group_name},
    }
    response = requests_session.post(
        urljoin(conf.getoption("server"), "/api/v3/user/"), headers=headers, data=user_data
    )
    assert response.status_code == 201, response.json()
    assert_valid_schema(response.json())
