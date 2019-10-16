from support.assertions import assert_valid_schema
from urllib.parse import urljoin


def test_extension_list(conf, requests_session):
    response = requests_session.get(urljoin(conf.getoption("server"), "/api/v3/extension/"))
    assert response.status_code != 404
    assert_valid_schema(response.json())
