import json
import jsonschema
import magic
import pytest

from os.path import join, dirname
from random import randint


def _load_json_schema(filename):
    relative_path = join("schemas", filename)
    absolute_path = join(dirname(__file__), relative_path)

    with open(absolute_path) as schema_file:
        return json.loads(schema_file.read())


def assert_valid_schema(data, schema_file):
    schema = _load_json_schema(schema_file)
    return jsonschema.validate(data, schema)


def test_v3_actions(conf, requests_session):
    # Get a random action and validate it
    r = requests_session.get(conf.getoption("server") + "/api/v3/action/")
    r.raise_for_status()
    data = r.json()

    if len(data) == 0:
        pytest.skip("No list of v3 actions found")

    key = randint(0, len(data["results"]) - 1)
    action_id = data["results"][key]["id"]

    r = requests_session.get(conf.getoption("server") + "/api/v3/action/{}/".format(action_id))
    r.raise_for_status()
    data = r.json()

    if len(data) == 0:
        pytest.skip("Could not find a v3 action with the ID {}".format(action_id))

    assert r.status_code == 200
    assert_valid_schema(data, "v3.action.schema")


def test_v3_approval_request(conf, requests_session):
    r = requests_session.get(conf.getoption("server") + "/api/v3/approval_request/")
    r.raise_for_status()
    data = r.json()

    if len(data) == 0 or len(data["results"]) == 0:
        pytest.skip("No list of v3 approval requests found")

    assert r.status_code == 200


def test_v3_approval_request_with_id(conf, requests_session):
    # Get a random approval request and validate it
    r = requests_session.get(conf.getoption("server") + "/api/v3/approval_request/")
    r.raise_for_status()
    data = r.json()

    if len(data) == 0 or len(data["results"]) == 0:
        pytest.skip("Could not find a list of v3 approval requests")

    key = randint(0, len(data["results"]) - 1)
    approval_request_id = data["results"][key]["id"]

    r = requests_session.get(
        conf.getoption("server") + "/api/v3/approval_request/{}/".format(approval_request_id)
    )
    r.raise_for_status()
    data = r.json()

    if len(data) == 0:
        pytest.skip(
            "Could not find a v3 approval request for approval request ID {}".format(
                approval_request_id
            )
        )

    assert r.status_code == 200
    assert_valid_schema(data, "v3.approval_request.schema")


def test_v3_extension(conf, requests_session):
    r = requests_session.get(conf.getoption("server") + "/api/v3/extension")
    r.raise_for_status()
    data = r.json()

    if len(data) == 0:
        pytest.skip("Could not find a list of v3 extensions")

    assert r.status_code == 200


def test_v3_extension_with_id(conf, requests_session):
    # Get a random extension and validate it
    r = requests_session.get(conf.getoption("server") + "/api/v3/extension")
    r.raise_for_status()
    data = r.json()

    if len(data) == 0 or len(data["results"]) == 0:
        pytest.skip("Could not find a list of v3 extensions")

    key = randint(0, len(data["results"]) - 1)
    extension_id = data["results"][key]["id"]

    r = requests_session.get(
        conf.getoption("server") + "/api/v3/extension/{}/".format(extension_id)
    )
    r.raise_for_status()
    data = r.json()

    if len(data) == 0:
        pytest.skip("Could not find v3 extension with an ID of {}".format(extension_id))

    assert r.status_code == 200
    assert_valid_schema(data, "v3.extension.schema")


def test_v3_filters(conf, requests_session):
    r = requests_session.get(conf.getoption("server") + "/api/v3/filters")
    r.raise_for_status()
    data = r.json()

    if len(data) == 0:
        pytest.skip("Could not find a list of v3 filters")

    assert r.status_code == 200
    assert "channels" in data
    assert "countries" in data
    assert "status" in data


def test_v3_identicon(conf, requests_session):
    r = requests_session.get(conf.getoption("server") + "/api/v3/identicon/v1:12345.svg")
    r.raise_for_status()

    assert r.status_code == 200
    assert magic.from_buffer(r.content) == "SVG Scalable Vector Graphics image"


def test_v3_recipe(conf, requests_session):
    r = requests_session.get(conf.getoption("server") + "/api/v3/recipe/")
    r.raise_for_status()
    data = r.json()

    if len(data) == 0 or len(data["results"]) == 0:
        pytest.skip("Could not find a list of v3 recipes")

    assert r.status_code == 200

    assert "count" in data
    assert "next" in data
    assert "previous" in data
    assert len(data["results"]) > 0


def test_v3_recipe_with_id(conf, requests_session):
    # Get a random recipe and validate the schema
    r = requests_session.get(conf.getoption("server") + "/api/v3/recipe/")
    r.raise_for_status()
    data = r.json()

    if len(data) == 0 or len(data["results"]) == 0:
        pytest.skip("Could not find a list of v3 recipes")

    key = randint(0, len(data["results"]) - 1)
    recipe_id = data["results"][key]["id"]

    r = requests_session.get(conf.getoption("server") + "/api/v3/recipe/{}".format(recipe_id))
    r.raise_for_status()
    data = r.json()

    if len(data) == 0:
        pytest.skip("Could not find a v3 recipe with an ID of {}".format(recipe_id))

    assert r.status_code == 200
    assert_valid_schema(data, "v3.recipe.schema")


def test_v3_recipe_history_with_id(conf, requests_session):
    # Get a random recipe and try and get it's historu
    r = requests_session.get(conf.getoption("server") + "/api/v3/recipe/")
    r.raise_for_status()
    data = r.json()

    if len(data) == 0 or len(data["results"]) == 0:
        pytest.skip("Could not find a list of v3 recipes")

    key = randint(0, len(data["results"]) - 1)
    recipe_id = data["results"][key]["id"]

    r = requests_session.get(
        conf.getoption("server") + "/api/v3/recipe/{}/history/".format(recipe_id)
    )
    r.raise_for_status()
    data = r.json()

    if len(data) == 0:
        pytest.skip("Could not find a v3 recipe history for a recipe with ID {}".format(recipe_id))

    assert r.status_code == 200
    assert_valid_schema(data, "v3.recipe_history.schema")


def test_v3_recipe_revision(conf, requests_session):
    r = requests_session.get(conf.getoption("server") + "/api/v3/recipe_revision")
    r.raise_for_status()
    data = r.json()

    if len(data) == 0 or len(data["results"]) == 0:
        pytest.skip("Could not find a list of v3 recipe revisions")

    assert r.status_code == 200


def test_v3_recipe_revision_with_id(conf, requests_session):
    # Get a random recipe revision and validate it
    r = requests_session.get(conf.getoption("server") + "/api/v3/recipe_revision")
    r.raise_for_status()
    data = r.json()

    if len(data) == 0 or len(data["results"]) == 0:
        pytest.skip("Could not find a list of v3 recipe revisions")

    key = randint(0, len(data["results"]) - 1)
    recipe_id = data["results"][key]["id"]
    r = requests_session.get(
        conf.getoption("server") + "/api/v3/recipe_revision/{}/".format(recipe_id)
    )
    r.raise_for_status()
    data = r.json()

    if len(data) == 0:
        pytest.skip("Could not find a v3 recipe revision for recipe id {}".format(recipe_id))

    assert r.status_code == 200
    assert_valid_schema(data, "v3.recipe_revision.schema")
