from unittest.mock import patch

import pytest

from normandy.base.utils import aware_datetime
from normandy.recipes.tests import (
    CountryFactory,
    LocaleFactory,
    RecipeFactory,
    ReleaseChannelFactory
)


@pytest.mark.django_db
class TestClientClassifier(object):
    def test_classify_initial(self, admin_client):
        response = admin_client.get('/admin/classifier_preview')
        assert response.status_code == 200

    def test_classify(self, admin_client):
        locale, other_locale = LocaleFactory.create_batch(2)
        country = CountryFactory()
        release_channel = ReleaseChannelFactory()

        matching_recipe = RecipeFactory(
            enabled=True,
            locales=[locale],
            countries=[country],
            release_channels=[release_channel],
            start_time=aware_datetime(2016, 1, 1),
            end_time=aware_datetime(2016, 1, 3),
        )
        RecipeFactory(locales=[other_locale])  # Non-matching

        response = admin_client.get('/admin/classifier_preview', {
            'locale': locale.code,
            'release_channel': release_channel.slug,
            'country': country.code,
            'request_time_0': '2016-01-02',
            'request_time_1': '00:00:00',
        })

        assert response.status_code == 200
        assert list(response.context['bundle']) == [matching_recipe]

    def test_classify_empty_time(self, admin_client):
        """
        If the request_time isn't provided, default to the current time.
        """
        locale, other_locale = LocaleFactory.create_batch(2)
        country = CountryFactory()
        release_channel = ReleaseChannelFactory()

        matching_recipe = RecipeFactory(
            enabled=True,
            locales=[locale],
            countries=[country],
            release_channels=[release_channel],
            start_time=aware_datetime(2016, 1, 1),
            end_time=aware_datetime(2016, 1, 3),
        )
        RecipeFactory(locales=[other_locale])  # Non-matching

        with patch('normandy.base.middleware.timezone') as timezone:
            timezone.now.return_value = aware_datetime(2016, 1, 2)
            response = admin_client.get('/admin/classifier_preview', {
                'locale': locale.code,
                'release_channel': release_channel.slug,
                'country': country.code,
                'request_time_0': '',
                'request_time_1': '',
            })

        assert response.status_code == 200
        assert list(response.context['bundle']) == [matching_recipe]

    def test_classify_no_sample(self, admin_client):
        """The classify view should ignore sampling."""
        locale = LocaleFactory()
        country = CountryFactory()
        release_channel = ReleaseChannelFactory()

        recipe = RecipeFactory(sample_rate=0)
        response = admin_client.get('/admin/classifier_preview', {
            'locale': locale.code,
            'release_channel': release_channel.slug,
            'country': country.code
        })

        assert response.status_code == 200
        assert not recipe.matches(response.context['client'])
        assert list(response.context['bundle']) == [recipe]
