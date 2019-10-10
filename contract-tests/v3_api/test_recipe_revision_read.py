from random import randint
from support.assertions import assert_valid_schema


def test_recipe_revision_read(conf, requests_session):
    # Get a random recipe revision from the list and verify it
    response = requests_session.get(conf.getoption("server") + "/api/v3/recipe_revision/")
    data = response.json()
    idx = randint(0, len(data["results"]) - 1)
    id = data["results"][idx]["id"]
    response = requests_session.get(
        conf.getoption("server") + "/api/v3/recipe_revision/{}/".format(id)
    )
    assert_valid_schema(response.json())
