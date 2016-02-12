import pytest

from normandy.recipes.tests import ActionFactory, RecipeActionFactory


@pytest.mark.django_db
class TestAction(object):
    def test_recipes_used_by(self):
        recipe_action = RecipeActionFactory(recipe__enabled=True)
        assert [recipe_action.recipe] == list(recipe_action.action.recipes_used_by)

        action = ActionFactory()
        recipe_actions = RecipeActionFactory.create_batch(2, action=action, recipe__enabled=True)
        assert set(action.recipes_used_by) == set([ra.recipe for ra in recipe_actions])

    def test_recipes_used_by_empty(self):
        assert list(ActionFactory().recipes_used_by) == []

        action = ActionFactory()
        RecipeActionFactory.create_batch(2, action=action, recipe__enabled=False)
        assert list(action.recipes_used_by) == []

    def test_in_use(self):
        action = ActionFactory()
        assert not action.in_use

        RecipeActionFactory(action=action, recipe__enabled=False)
        assert not action.in_use

        RecipeActionFactory(action=action, recipe__enabled=True)
        assert action.in_use
