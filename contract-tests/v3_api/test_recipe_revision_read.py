import pytest

from random import randint
from support.assertions import assert_valid_schema
from urllib.parse import urljoin


def test_recipe_revision_read(conf, requests_session):
    # Get a random recipe revision from the list and verify it
    response = requests_session.get(urljoin(conf.getoption("server"), "/api/v3/recipe_revision/"))
    data = response.json()

    if len(data["results"]) == 0:
        pytest.skip("Could not find any recipe revisions")

    idx = randint(0, len(data["results"]) - 1)
    id = data["results"][idx]["id"]
    response = requests_session.get(
        urljoin(conf.getoption("server"), "/api/v3/recipe_revision/{}/".format(id))
    )
    assert_valid_schema(response.json())
