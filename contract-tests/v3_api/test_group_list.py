from support.assertions import assert_valid_schema
from urllib.parse import urljoin


def test_group_list(conf, requests_session, headers):
    # Get our list of groups
    response = requests_session.get(
        urljoin(conf.getoption("server"), "/api/v3/group/"), headers=headers
    )
    assert response.status_code == 200
    assert_valid_schema(response.json())
