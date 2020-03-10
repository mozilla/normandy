import uuid

from support.assertions import assert_valid_schema
from urllib.parse import urljoin


def test_group_delete(conf, requests_session, headers):
    # Create a new group
    data = {"name": str(uuid.uuid4())}
    response = requests_session.post(
        urljoin(conf.getoption("server"), "/api/v3/group/"), headers=headers, data=data
    )
    assert response.status_code == 201
    assert_valid_schema(response.json())
    group_data = response.json()
    group_id = group_data["id"]

    # Verify group was stored and contains expected data
    response = requests_session.get(
        urljoin(conf.getoption("server"), "/api/v3/group/{}/".format(group_id)), headers=headers
    )
    group_data = response.json()
    assert response.status_code == 200
    assert_valid_schema(response.json())

    # Delete the group
    response = requests_session.delete(
        urljoin(conf.getoption("server"), "/api/v3/group/{}/".format(group_id)), headers=headers
    )
    assert response.status_code == 204

    # Verify that it no longer exists
    response = requests_session.get(
        urljoin(conf.getoption("server"), "/api/v3/group/{}/".format(group_id)), headers=headers
    )
    assert response.status_code == 404
