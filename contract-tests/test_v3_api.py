import json
import jsonschema
import magic

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
    key = randint(0, len(data["results"]) - 1)
    action_id = data["results"][key]["id"]

    r = requests_session.get(conf.getoption("server") + "/api/v3/action/{}/".format(action_id))
    r.raise_for_status()
    data = r.json()

    assert r.status_code == 200
    assert_valid_schema(data, "v3.action.schema")


def test_v3_approval_request(conf, requests_session):
    r = requests_session.get(conf.getoption("server") + "/api/v3/approval_request/")
    r.raise_for_status()
    data = r.json()

    assert r.status_code == 200
    assert len(data) > 0
    assert len(data["results"]) > 0


def test_v3_approval_request_with_id(conf, requests_session):
    # Get a random approval request and validate it
    r = requests_session.get(conf.getoption("server") + "/api/v3/approval_request/")
    r.raise_for_status()
    data = r.json()
    key = randint(0, len(data["results"]) - 1)
    approval_request_id = data["results"][key]["id"]

    id = randint(1, 9)
    r = requests_session.get(
        conf.getoption("server") + "/api/v3/approval_request/{}/".format(approval_request_id)
    )
    r.raise_for_status()
    data = r.json()

    assert r.status_code == 200
    assert_valid_schema(data, "v3.approval_request.schema")


def test_v3_extension(conf, requests_session):
    r = requests_session.get(conf.getoption("server") + "/api/v3/extension")
    r.raise_for_status()
    data = r.json()

    assert r.status_code == 200
    assert len(data) > 0
    assert int(data["count"]) > 0
    assert len(data["results"]) > 0


def test_v3_extension_with_id(conf, requests_session):
    # Get a random extension and validate it
    r = requests_session.get(conf.getoption("server") + "/api/v3/extension")
    r.raise_for_status()
    data = r.json()
    key = randint(0, len(data["results"]) - 1)
    extension_id = data["results"][key]["id"]

    r = requests_session.get(
        conf.getoption("server") + "/api/v3/extension/{}/".format(extension_id)
    )
    r.raise_for_status()
    data = r.json()

    assert r.status_code == 200
    assert_valid_schema(data, "v3.extension.schema")


def test_v3_filters(conf, requests_session):
    r = requests_session.get(conf.getoption("server") + "/api/v3/filters")
    r.raise_for_status()
    data = r.json()
    assert r.status_code == 200
    assert len(data) > 0
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

    assert r.status_code == 200
    assert len(data) > 0

    assert "count" in data
    assert "next" in data
    assert "previous" in data
    assert len(data["results"]) > 0


def test_v3_recipe_with_id(conf, requests_session):
    # Get a random recipe and validate the schema
    r = requests_session.get(conf.getoption("server") + "/api/v3/recipe/")
    r.raise_for_status()
    data = r.json()
    key = randint(0, len(data["results"]) - 1)
    recipe_id = data["results"][key]["id"]

    r = requests_session.get(conf.getoption("server") + "/api/v3/recipe/{}".format(recipe_id))
    r.raise_for_status()
    data = r.json()

    assert r.status_code == 200
    assert_valid_schema(data, "v3.recipe.schema")


def test_v3_recipe_history_with_id(conf, requests_session):
    # Get a random recipe and try and get it's historu
    r = requests_session.get(conf.getoption("server") + "/api/v3/recipe/")
    r.raise_for_status()
    data = r.json()
    key = randint(0, len(data["results"]) - 1)
    recipe_id = data["results"][key]["id"]

    r = requests_session.get(
        conf.getoption("server") + "/api/v3/recipe/{}/history/".format(recipe_id)
    )
    r.raise_for_status()
    data = r.json()

    assert r.status_code == 200
    assert_valid_schema(data, "v3.recipe_history.schema")


def test_v3_recipe_revision(conf, requests_session):
    r = requests_session.get(conf.getoption("server") + "/api/v3/recipe_revision")
    r.raise_for_status()
    data = r.json()

    assert r.status_code == 200
    assert len(data["results"]) > 0


def test_v3_recipe_revision_with_id(conf, requests_session):
    # Get a random recipe revision and validate it
    r = requests_session.get(conf.getoption("server") + "/api/v3/recipe_revision")
    r.raise_for_status()
    data = r.json()
    key = randint(0, len(data["results"]) - 1)
    recipe_id = data["results"][key]["id"]
    r = requests_session.get(
        conf.getoption("server") + "/api/v3/recipe_revision/{}/".format(recipe_id)
    )
    r.raise_for_status()
    data = r.json()

    assert r.status_code == 200
    assert_valid_schema(data, "v3.recipe_revision.schema")
