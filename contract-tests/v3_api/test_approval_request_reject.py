import pytest

from support.assertions import assert_valid_schema
from support.helpers import new_recipe
from urllib.parse import urljoin


def test_approval_request_reject(conf, requests_session, headers):
    # Get an action we can work with
    action_response = requests_session.get(
        urljoin(conf.getoption("server"), "/api/v3/action/"), headers=headers
    )
    data = action_response.json()
    action_id = data["results"][0]["id"]

    # Create a recipe associated with that action
    recipe_details = new_recipe(requests_session, action_id, conf.getoption("server"), headers)

    # Create a approval request
    response = requests_session.post(
        urljoin(
            conf.getoption("server"),
            "/api/v3/recipe_revision/{}/request_approval/".format(
                recipe_details["latest_revision_id"]
            ),
        ),
        headers=headers,
    )
    data = response.json()
    approval_id = data["id"]
    assert response.status_code != 404
    assert_valid_schema(response.json())

    # Reject the approval
    response = requests_session.post(
        urljoin(
            conf.getoption("server"), "/api/v3/approval_request/{}/reject/".format(approval_id)
        ),
        data={"comment": "r-"},
        headers=headers,
    )
    assert response.status_code == 200
    assert_valid_schema(response.json())

    # Look at the recipe and make sure it the approval status has been set to False and our comment shows up
    response = requests_session.get(
        urljoin(conf.getoption("server"), "/api/v3/recipe/{}/".format(recipe_details["id"]))
    )
    assert response.status_code != 404
    assert_valid_schema(response.json())
    approval_request = response.json()["latest_revision"]["approval_request"]
    assert approval_request["approved"] == False
    assert approval_request["comment"] == "r-"
