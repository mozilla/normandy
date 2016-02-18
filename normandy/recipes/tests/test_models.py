import pytest

from normandy.recipes.tests import (
    ActionFactory, CountryFactory, LocaleFactory, RecipeActionFactory, RecipeFactory,
    ReleaseChannelFactory)
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

    def test_filter_by_locale_none(self):
        recipe = RecipeFactory(locales=[])
        client = ClientFactory(locale='en-US')
        assert recipe.matches(client)

    def test_filter_by_locale_one(self):
        locale1 = LocaleFactory()
        locale2 = LocaleFactory()
        recipe = RecipeFactory(locales=[locale1])
        client1 = ClientFactory(locale=locale1.code)
        client2 = ClientFactory(locale=locale2.code)

        assert recipe.matches(client1)
        assert not recipe.matches(client2)

    def test_filter_by_locale_many(self):
        locale1 = LocaleFactory()
        locale2 = LocaleFactory()
        locale3 = LocaleFactory()
        recipe = RecipeFactory(locales=[locale1, locale2])
        client1 = ClientFactory(locale=locale1.code)
        client2 = ClientFactory(locale=locale2.code)
        client3 = ClientFactory(locale=locale3.code)

        assert recipe.matches(client1)
        assert recipe.matches(client2)
        assert not recipe.matches(client3)

    def test_filter_by_country_none(self):
        recipe = RecipeFactory(countries=[])
        client = ClientFactory(country='US')
        assert recipe.matches(client)

    def test_filter_by_country_one(self):
        country1 = LocaleFactory()
        country2 = LocaleFactory()
        recipe = RecipeFactory(locales=[country1])
        client1 = ClientFactory(locale=country1.code)
        client2 = ClientFactory(locale=country2.code)

        assert recipe.matches(client1)
        assert not recipe.matches(client2)

    def test_filter_by_country_many(self):
        country1 = CountryFactory()
        country2 = CountryFactory()
        country3 = CountryFactory()
        recipe = RecipeFactory(countries=[country1, country2])
        client1 = ClientFactory(country=country1.code)
        client2 = ClientFactory(country=country2.code)
        client3 = ClientFactory(country=country3.code)

        assert recipe.matches(client1)
        assert recipe.matches(client2)
        assert not recipe.matches(client3)
