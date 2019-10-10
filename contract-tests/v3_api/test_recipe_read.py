import pytest

from random import randint
from support.assertions import assert_valid_schema


def test_recipe_read(conf, requests_session):
    # Get random recipe and make sure it's valid
    response = requests_session.get(conf.getoption("server") + "/api/v3/recipe/")
    data = response.json()

    if len(data["results"]) == 0:
        pytest.skip("Could not find any recipes")

    element = randint(0, len(data["results"]) - 1)
    recipe_id = data["results"][element]["id"]
    response = requests_session.get(
        conf.getoption("server") + "/api/v3/recipe/{}".format(recipe_id)
    )
    data = response.json()
    assert response.status_code != 404
    assert_valid_schema(response.json())
