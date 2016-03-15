import pytest

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

    def test_classify(self, admin_client, django_cache):
        locale, other_locale = LocaleFactory.create_batch(2)
        country = CountryFactory()
        release_channel = ReleaseChannelFactory()

        matching_recipe = RecipeFactory(
            enabled=True,
            locales=[locale],
            countries=[country],
            release_channels=[release_channel]
        )
        RecipeFactory(locales=[other_locale])  # Non-matching

        response = admin_client.get('/admin/classifier_preview', {
            'locale': locale.code,
            'release_channel': release_channel.slug,
            'country': country.code
        })

        assert response.status_code == 200
        assert list(response.context['bundle']) == [matching_recipe]

    def test_classify_no_sample(self, admin_client, django_cache):
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
