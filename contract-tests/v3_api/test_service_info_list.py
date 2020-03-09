from support.assertions import assert_valid_schema
from urllib.parse import urljoin


def test_service_info_list(conf, requests_session):
    response = requests_session.get(urljoin(conf.getoption("server"), "/api/v3/service_info/"))
    assert response.status_code == 200
    assert_valid_schema(response.json())

