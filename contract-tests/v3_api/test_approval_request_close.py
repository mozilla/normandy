from support.assertions import assert_valid_schema
from support.helpers import new_recipe
from urllib.parse import urljoin


def test_approval_request_close(conf, requests_session, headers):
    # Get an action we can work with
    action_response = requests_session.get(
        urljoin(conf.getoption("server"), "/api/v3/action/"), headers=headers
    )
    data = action_response.json()
    action_id = data["results"][0]["id"]

    # Create a recipe
    recipe_details = new_recipe(requests_session, action_id, conf.getoption("server"), headers)

    # Create an approval request
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

    # Close the approval request
    response = requests_session.post(
        urljoin(
            conf.getoption("server"), "/api/v3/approval_request/{}/close/".format(approval_id)
        ),
        headers=headers,
    )
    assert response.status_code == 204

    # Verify that is no longer exists
    response = requests_session.get(
        urljoin(conf.getoption("server"), "/api/v3/approval_request/{}/".format(approval_id)),
        headers=headers,
    )
    assert response.status_code == 404
