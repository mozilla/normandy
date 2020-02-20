import pytest

from support.assertions import assert_valid_schema
from urllib.parse import urljoin


def test_approval_request_read(conf, requests_session):
    # Get the ID of the first approval request and use it
    response = requests_session.get(urljoin(conf.getoption("server"), "/api/v3/approval_request/"))
    data = response.json()

    if len(data["results"]) == 0:
        pytest.skip("No approval requests were found")

    id = data["results"][0]["id"]

    response = requests_session.get(
        urljoin(conf.getoption("server"), "/api/v3/approval_request/{}/".format(id))
    )
    assert response.status_code != 404
    assert_valid_schema(response.json())
