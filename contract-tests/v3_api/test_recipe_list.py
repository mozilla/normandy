from support.assertions import assert_valid_schema
from urllib.parse import urljoin

def test_recipe_list(conf, requests_session):
    response = requests_session.get(urljoin(conf.getoption("server"), "/api/v3/recipe/"))
    assert response.status_code != 404
    assert_valid_schema(response.json())
