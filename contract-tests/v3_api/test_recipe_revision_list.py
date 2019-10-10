from support.assertions import assert_valid_schema


def test_recipe_revision_list(conf, requests_session):
    response = requests_session.get(conf.getoption('server') + '/api/v3/recipe_revision/')
    assert response.status_code != 404
    assert_valid_schema(response.json())