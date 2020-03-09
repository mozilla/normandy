import pytest
import uuid

from support.assertions import assert_valid_schema
from support.helpers import new_recipe
from urllib.parse import urljoin


def test_recipe_delete(conf, requests_session, headers):
    # Get an action we can work with
    action_response = requests_session.get(
        urljoin(conf.getoption("server"), "/api/v3/action/"),
        headers=headers
    )
    data = action_response.json()
    action_id = data['results'][0]['id']

    # Create a recipe associated with that action
    recipe_details = new_recipe(requests_session, action_id, conf.getoption("server"), headers)

    # Delete the recipe
    response = requests_session.delete(
        urljoin(conf.getoption("server"), "/api/v3/recipe/{}/".format(recipe_details['id'])),
        headers=headers
    )
    assert response.status_code == 204, response.json()
