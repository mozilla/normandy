import pytest

from normandy.recipes.tests import RecipeFactory
from normandy.studies.tests import ExtensionFactory


@pytest.mark.django_db
def test_recipes_used_by():
    extension = ExtensionFactory()
    RecipeFactory()  # Create a recipe that doesn't use the extension
    used_in_recipe_1 = RecipeFactory(
        name="test 1",
        arguments_json=f'{{"xpi_url": "{extension.xpi.url}"}}',
    )
    used_in_recipe_2 = RecipeFactory(
        name="test 2",
        arguments_json=f'{{"xpi_url": "{extension.xpi.url}"}}',
    )

    assert set(extension.recipes_used_by) == set([used_in_recipe_1, used_in_recipe_2])
