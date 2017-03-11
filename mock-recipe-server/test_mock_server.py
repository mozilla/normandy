"""
Tests for the mock-server itself.
"""
from utils import APIPath


def test_testcase_difference(root_path):
    """Ensure that different testcases output different data."""
    recipes = set()

    testcase_paths = (
        APIPath(path, 'http://example.com')
        for path in root_path.path.iterdir() if path.is_dir()
    )
    for testcase_path in testcase_paths:
        recipe_path = testcase_path.add('api', 'v1', 'recipe')

        recipe_data = recipe_path.read()
        assert recipe_data not in recipes
        recipes.add(recipe_data)

        # This asserts both that testcases have differing signed data
        # and that a single testcase does not have the same data for
        # signed and unsigned endpoints.
        signed_recipe_data = recipe_path.add('signed').read()
        assert signed_recipe_data not in recipes
        recipes.add(signed_recipe_data)
