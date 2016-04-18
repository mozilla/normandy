from unittest.mock import patch

import pytest

from normandy.recipes.models import Client, Country, get_locales, match_enabled
from normandy.recipes.tests import (
    ActionFactory,
    ClientFactory,
    CountryFactory,
    LocaleFactory,
    RecipeFactory,
    ReleaseChannelFactory
)


@pytest.mark.django_db
class TestAction(object):
    def test_recipes_used_by(self):
        recipe = RecipeFactory(enabled=True)
        assert [recipe] == list(recipe.action.recipes_used_by)

        action = ActionFactory()
        recipes = RecipeFactory.create_batch(2, action=action, enabled=True)
        assert set(action.recipes_used_by) == set(recipes)

    def test_recipes_used_by_empty(self):
        assert list(ActionFactory().recipes_used_by) == []

        action = ActionFactory()
        RecipeFactory.create_batch(2, action=action, enabled=False)
        assert list(action.recipes_used_by) == []

    def test_in_use(self):
        action = ActionFactory()
        assert not action.in_use

        RecipeFactory(action=action, enabled=False)
        assert not action.in_use

        RecipeFactory(action=action, enabled=True)
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
        country1 = CountryFactory()
        country2 = CountryFactory()
        recipe = RecipeFactory(countries=[country1])
        client1 = ClientFactory(country=country1.code)
        client2 = ClientFactory(country=country2.code)

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

    def test_filter_by_sample_rate(self):
        always_match = RecipeFactory(sample_rate=1.0)
        never_match = RecipeFactory(sample_rate=0.0)
        client = ClientFactory()

        assert always_match.matches(client)
        assert not never_match.matches(client)

    def test_filter_exclude(self):
        recipe = RecipeFactory(enabled=False)
        client = ClientFactory()

        assert not recipe.matches(client)
        assert recipe.matches(client, exclude=[match_enabled])

    def test_filter_exclude_many(self):
        locale_match1, locale_match2, locale_not = LocaleFactory.create_batch(3)
        recipe = RecipeFactory(locales=[locale_match1, locale_match2])
        client = ClientFactory(locale=locale_not.code)

        assert not recipe.matches(client)
        assert recipe.matches(client, exclude=[get_locales])

    def test_revision_id_increments(self):
        """Ensure that the revision id is incremented on each save"""
        recipe = RecipeFactory()

        # The factory saves a couple times so revision id is not 0
        revision_id = recipe.revision_id

        recipe.save()
        assert recipe.revision_id == revision_id + 1


@pytest.mark.django_db
class TestLocale(object):
    def test_matches_works(self):
        locale = LocaleFactory(code='en-US')
        client1 = ClientFactory(locale='en-US')
        client2 = ClientFactory(locale='de')
        assert locale.matches(client1)
        assert not locale.matches(client2)

    def test_matches_deals_with_none(self):
        locale = LocaleFactory(code='en-US')
        client = ClientFactory(locale=None)
        assert not locale.matches(client)


@pytest.mark.django_db
class TestCountry(object):
    def test_matches_works(self):
        # Countries are always made in migrations
        country = Country.objects.get(code='US')
        client1 = ClientFactory(country='US')
        client2 = ClientFactory(country='DE')
        assert country.matches(client1)
        assert not country.matches(client2)

    def test_matches_deals_with_none(self):
        country = LocaleFactory(code='US')
        client = ClientFactory(country=None)
        assert not country.matches(client)


@pytest.mark.django_db
class TestReleaseChannel(object):
    def test_matches_works(self):
        channel = ReleaseChannelFactory(slug='release')
        client1 = ClientFactory(release_channel='release')
        client2 = ClientFactory(release_channel='beta')
        assert channel.matches(client1)
        assert not channel.matches(client2)

    def test_matches_deals_with_none(self):
        channel = ReleaseChannelFactory(slug='release')
        client = ClientFactory(release_channel=None)
        assert not channel.matches(client)


class TestClient(object):
    @pytest.mark.parametrize('x_forwarded_for,expected_ip', [
        ('192.0.2.0,127.0.0.1', '192.0.2.0'),
        ('192.0.2.0', '192.0.2.0'),
    ])
    def test_country_x_forwarded_for(self, rf, x_forwarded_for, expected_ip):
        client = Client(rf.get('/', HTTP_X_FORWARDED_FOR=x_forwarded_for))

        with patch('normandy.recipes.models.get_country_code') as get_country_code:
            assert client.country == get_country_code.return_value
            get_country_code.assert_called_with(expected_ip)

    def test_country_remote_addr_fallback(self, rf):
        client = Client(rf.get('/', REMOTE_ADDR='192.0.2.0'))

        with patch('normandy.recipes.models.get_country_code') as get_country_code:
            assert client.country == get_country_code.return_value
            get_country_code.assert_called_with('192.0.2.0')
