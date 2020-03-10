import uuid

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

    # Update the name of the recipe
    updated_data = {
        "name": "update" + str(uuid.uuid4()),
        "action_id": action_id,
        "arguments": '{"learnMoreMessage":"This field may not be blank.","learnMoreUrl":"This field may not be blank.","message":"This field may not be blank.","postAnswerUrl":"This field may not be blank.","surveyId":"'
        + str(uuid.uuid4())
        + '","thanksMessage":"This field may not be blank."}',
    }
    response = requests_session.put(
        urljoin(conf.getoption("server"), "/api/v3/recipe/{}/".format(recipe_details["id"])),
        data=updated_data,
        headers=headers,
    )
    assert response.status_code == 200, response.json()
    assert_valid_schema(response.json())
    latest_revision = response.json()["latest_revision"]
    assert latest_revision["name"] == updated_data["name"]
