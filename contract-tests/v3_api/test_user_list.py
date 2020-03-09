from support.assertions import assert_valid_schema
from urllib.parse import urljoin


def test_user_list(conf, requests_session, headers):
    response = requests_session.get(
        urljoin(conf.getoption("server"), "/api/v3/user/"), headers=headers
    )
    assert response.status_code == 200
    assert_valid_schema(response.json())
