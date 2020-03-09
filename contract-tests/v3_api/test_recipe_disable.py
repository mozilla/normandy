import pytest

from support.helpers import approve_approval_request, create_approval_request, enable_recipe, new_recipe
from support.assertions import assert_valid_schema
from urllib.parse import urljoin


def test_recipe_disable(conf, requests_session, headers):
    # Get a list of actions and pick the first one
    action_response = requests_session.get(
        urljoin(conf.getoption("server"), "/api/v3/action/"),
        headers=headers
    )
    data = action_response.json()
    action_id = data['results'][0]['id']

    # Then create an approval request and submit it
    recipe_details = new_recipe(requests_session, action_id, conf.getoption("server"), headers)
    response = create_approval_request(requests_session, conf.getoption("server"), recipe_details['latest_revision_id'], headers)
    data = response.json()
    approval_id = data['id']
    approver_email = data['creator']['email']
    assert response.status_code != 404
    assert_valid_schema(response.json())

    # Verify that the request was actually created
    response = requests_session.get(
        urljoin(conf.getoption("server"), "/api/v3/approval_request/{}".format(approval_id)),
    )
    data = response.json()
    assert response.status_code != 404
    assert_valid_schema(response.json())
    assert data['id'] == approval_id
    assert data['creator']['email'] == approver_email

    # Approve the approval request
    response = approve_approval_request(requests_session, conf.getoption("server"), approval_id, headers)
    assert response.status_code != 404
    assert_valid_schema(response.json())

    # Look at the recipe and make sure that the recipe has been approved and our comment shows up
    response = requests_session.get(
        urljoin(conf.getoption("server"), "/api/v3/recipe/{}".format(recipe_details['id']))
    )
    assert response.status_code not in(404,500)
    assert_valid_schema(response.json())
    approval_request = response.json()['latest_revision']['approval_request']
    assert approval_request['approved'] == True
    assert approval_request['comment'] == 'r+'
    assert response.json()['latest_revision']['enabled'] == False

    # Enable the recipe
    response = enable_recipe(requests_session, conf.getoption("server"), recipe_details['id'], headers)
    assert response.status_code not in(404,500)
    assert_valid_schema(response.json())
    assert response.json()['latest_revision']['enabled'] == True


    # Disable the recipe and verify it
    response = requests_session.post(
        urljoin(conf.getoption("server"), "/api/v3/recipe/{}/disable/".format(recipe_details['id'])),
        headers=headers
    )
    assert response.status_code not in(404,500)
    assert_valid_schema(response.json())
    assert response.json()['latest_revision']['enabled'] == False
