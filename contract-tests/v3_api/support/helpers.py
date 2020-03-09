import requests
import urllib3
import uuid

from faker import Faker
from urllib.parse import urljoin


def approve_approval_request(requests_session, server, approval_id, headers):
    return requests_session.post(
        urljoin(server, "/api/v3/approval_request/{}/approve/".format(approval_id)),
        data={"comment": "r+"},
        headers=headers
    )


def create_approval_request(requests_session, server, latest_revision_id, headers):
    return requests_session.post(
        urljoin(
            server,
            "/api/v3/recipe_revision/{}/request_approval/".format(latest_revision_id)
        ),
        headers=headers
    )


def create_new_user(requests_session, server, headers):
    # Get a list of groups and grab the ID of the first one
    response = requests_session.get(
        urljoin(server, "/api/v3/group/"),
        headers=headers
    )
    group_id = response.json()['results'][0]['id']
    group_name = response.json()['results'][0]['name']
    fake = Faker()
    email = fake.company_email()

    # Create a user, assigning them to the group we obtained
    user_data = {
        'first_name': fake.first_name(),
        'last_name': fake.last_name(),
        'email': fake.company_email(),
        'groups': {
            'id': group_id,
            'name': group_name
        }
    }
    response = requests_session.post(
        urljoin(server, "/api/v3/user/"),
        headers=headers,
        data=user_data
    )

    return {
        'id': response.json()['id'],
        'first_name': response.json()['first_name'],
        'last_name': response.json()['last_name'],
        'group_id': group_id
    }


def enable_recipe(requests_session, server, recipe_id, headers):
    return requests_session.post(
        urljoin(server, "/api/v3/recipe/{}/enable/".format(recipe_id)),
        headers=headers
    )


def new_recipe(requests_session, action_id, server, headers):
    urllib3.disable_warnings()

    # Create a recipe
    recipe_data = {
        "action_id": action_id,
        "arguments": '{"learnMoreMessage":"This field may not be blank.","learnMoreUrl":"This field may not be blank.","message":"This field may not be blank.","postAnswerUrl":"This field may not be blank.","surveyId":"'
        + str(uuid.uuid4())
        + '","thanksMessage":"This field may not be blank."}',
        "name": "test recipe",
        "extra_filter_expression": "counter == 0",
        "enabled": "false",
    }

    response = requests_session.post(
        urljoin(server, "/api/v3/recipe/"), data=recipe_data, headers=headers
    )
    data = response.json()
    return {"id": data["id"], "latest_revision_id": data["latest_revision"]["id"]}

