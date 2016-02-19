import pytest

from normandy.recipes.tests import (
    ActionFactory, RecipeActionFactory, RecipeFactory, ReleaseChannelFactory)
from normandy.classifier.tests import ClientFactory


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


@pytest.mark.django_db
class TestRecipe(object):
    def test_filter_by_channel_empty(self):
        recipe = RecipeFactory(release_channels=[])
        client = ClientFactory(release_channel='release')
        assert recipe.matches(client)

    def test_filter_by_channel_one(self):
        beta = ReleaseChannelFactory(slug='beta')
        recipe = RecipeFactory(release_channels=[beta])

        release_client = ClientFactory(release_channel='release')
        beta_client = ClientFactory(release_channel='beta')

        assert not recipe.matches(release_client)
        assert recipe.matches(beta_client)

    def test_filter_by_channel_many(self):
        release = ReleaseChannelFactory(slug='release')
        beta = ReleaseChannelFactory(slug='beta')
        recipe = RecipeFactory(release_channels=[release, beta])

        release_client = ClientFactory(release_channel='release')
        beta_client = ClientFactory(release_channel='beta')
        aurora_client = ClientFactory(release_channel='aurora')

        assert recipe.matches(release_client)
        assert recipe.matches(beta_client)
        assert not recipe.matches(aurora_client)
