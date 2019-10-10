import pytest

from support.assertions import assert_valid_schema


def test_extension_read(conf, requests_session):
    response = requests_session.get(conf.getoption("server") + "/api/v3/extension/")
    assert response.status_code != 404
    details = response.json()

    # Get the ID of the first record in the list and read it
    if len(details["results"]) == 0:
        pytest.skip("No extensions results were found")

    extension_id = details["results"][0]["id"]
    response = requests_session.get(
        conf.getoption("server") + "/api/v3/extension/{}".format(extension_id)
    )
    assert_valid_schema(response.json())
