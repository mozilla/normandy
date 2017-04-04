import hashlib
from unittest.mock import patch

from django.core.exceptions import ImproperlyConfigured, ValidationError

import pytest
from rest_framework import serializers

from normandy.base.tests import Whatever
from normandy.recipes.models import (
    Client,
    INFO_CREATE_REVISION,
    INFO_REQUESTING_RECIPE_SIGNATURES,
    Recipe,
)
from normandy.recipes.tests import (
    ActionFactory,
    ChannelFactory,
    CountryFactory,
    LocaleFactory,
    RecipeFactory,
    SignatureFactory,
)


@pytest.fixture
def mock_logger(mocker):
    return mocker.patch('normandy.recipes.models.logger')


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

    def test_validate_arguments_it_works(self):
        action = ActionFactory(name='nothing special')
        # does not raise an exception
        action.validate_arguments({})

    def test_validate_arguments_preference_exeriments_unique_branch_slugs(self):
        action = ActionFactory(name='preference-experiment')
        arguments = {
            'slug': 'test',
            'branches': [
                {'slug': 'unique', 'value': 'a'},
                {'slug': 'duplicate', 'value': 'b'},
                {'slug': 'duplicate', 'value': 'c'}
            ]
        }
        with pytest.raises(serializers.ValidationError) as exc_info:
            action.validate_arguments(arguments)
        error = action.errors['duplicate_branch_slug']
        assert exc_info.value.detail == {'arguments': {'branches': {2: {'slug': error}}}}

    def test_validate_arguments_preference_exeriments_unique_branch_values(self):
        action = ActionFactory(name='preference-experiment')
        arguments = {
            'slug': 'test',
            'branches': [
                {'slug': 'a', 'value': 'unique'},
                {'slug': 'b', 'value': 'duplicate'},
                {'slug': 'c', 'value': 'duplicate'}
            ]
        }
        with pytest.raises(serializers.ValidationError) as exc_info:
            action.validate_arguments(arguments)
        error = action.errors['duplicate_branch_value']
        assert exc_info.value.detail == {'arguments': {'branches': {2: {'value': error}}}}

    def test_validate_arguments_preference_experiments_unique_experiment_slug(self):
        action = ActionFactory(name='preference-experiment')
        arguments = {'slug': 'duplicate', 'branches': []}
        RecipeFactory(action=action, arguments=arguments)
        with pytest.raises(serializers.ValidationError) as exc_info:
            action.validate_arguments(arguments)
        error = action.errors['duplicate_experiment_slug']
        assert exc_info.value.detail == {'arguments': {'slug': error}}


@pytest.mark.django_db
class TestRecipe(object):
    def test_revision_id_doesnt_change_if_no_changes(self):
        """
        revision_id should not increment if a recipe is saved with no
        changes.
        """
        recipe = RecipeFactory()

        # The factory saves a couple times so revision id is not 0
        revision_id = recipe.revision_id

        recipe.save()
        assert recipe.revision_id == revision_id

    def test_filter_expression(self):
        channel1 = ChannelFactory(slug='beta', name='Beta')
        channel2 = ChannelFactory(slug='release', name='Release')
        country1 = CountryFactory(code='US', name='USA')
        country2 = CountryFactory(code='CA', name='Canada')
        locale1 = LocaleFactory(code='en-US', name='English (US)')
        locale2 = LocaleFactory(code='fr-CA', name='French (CA)')

        r = RecipeFactory()
        assert r.filter_expression == ''

        r = RecipeFactory(channels=[channel1])
        assert r.filter_expression == "normandy.channel in ['beta']"

        r.update(channels=[channel1, channel2])
        assert r.filter_expression == "normandy.channel in ['beta', 'release']"

        r = RecipeFactory(countries=[country1])
        assert r.filter_expression == "normandy.country in ['US']"

        r.update(countries=[country1, country2])
        assert r.filter_expression == "normandy.country in ['CA', 'US']"

        r = RecipeFactory(locales=[locale1])
        assert r.filter_expression == "normandy.locale in ['en-US']"

        r.update(locales=[locale1, locale2])
        assert r.filter_expression == "normandy.locale in ['en-US', 'fr-CA']"

        r = RecipeFactory(extra_filter_expression='2 + 2 == 4')
        assert r.filter_expression == '2 + 2 == 4'

        r.update(channels=[channel1], countries=[country1], locales=[locale1])
        assert r.filter_expression == ("(normandy.locale in ['en-US']) && "
                                       "(normandy.country in ['US']) && "
                                       "(normandy.channel in ['beta']) && "
                                       "(2 + 2 == 4)")

    def test_canonical_json(self):
        recipe = RecipeFactory(
            action=ActionFactory(name='action'),
            arguments_json='{"foo": 1, "bar": 2}',
            channels=[ChannelFactory(slug='beta')],
            countries=[CountryFactory(code='CA')],
            enabled=False,
            extra_filter_expression='2 + 2 == 4',
            locales=[LocaleFactory(code='en-US')],
            name='canonical',
        )
        # Yes, this is really ugly, but we really do need to compare an exact
        # byte sequence, since this is used for hashing and signing
        filter_expression = (
            "(normandy.locale in ['en-US']) && (normandy.country in ['CA']) && "
            "(normandy.channel in ['beta']) && (2 + 2 == 4)"
        )
        expected = (
            '{'
            '"action":"action",'
            '"arguments":{"bar":2,"foo":1},'
            '"channels":["beta"],'
            '"countries":["CA"],'
            '"enabled":false,'
            '"extra_filter_expression":"2 + 2 == 4",'
            '"filter_expression":"%(filter_expression)s",'
            '"id":%(id)s,'
            '"last_updated":"%(last_updated)s",'
            '"locales":["en-US"],'
            '"name":"canonical",'
            '"revision_id":"%(revision_id)s"'
            '}'
        ) % {
            'id': recipe.id,
            'revision_id': recipe.revision_id,
            'last_updated': recipe.last_updated.strftime('%Y-%m-%dT%H:%M:%S.%fZ'),
            'filter_expression': filter_expression
        }
        expected = expected.encode()
        assert recipe.canonical_json() == expected

    def test_signature_is_correct_on_creation_if_autograph_available(self, mocked_autograph):
        recipe = RecipeFactory()
        expected_sig = hashlib.sha256(recipe.canonical_json()).hexdigest()
        assert recipe.signature.signature == expected_sig

    def test_signature_is_updated_if_autograph_available(self, mocked_autograph):
        recipe = RecipeFactory(name='unchanged')
        original_signature = recipe.signature
        assert original_signature is not None

        recipe.update(name='changed')

        assert recipe.name == 'changed'
        assert recipe.signature is not original_signature
        expected_sig = hashlib.sha256(recipe.canonical_json()).hexdigest()
        assert recipe.signature.signature == expected_sig

    def test_signature_is_cleared_if_autograph_unavailable(self, mocker):
        # Mock the Autographer to return an error
        mock_autograph = mocker.patch('normandy.recipes.models.Autographer')
        mock_autograph.return_value.sign_data.side_effect = ImproperlyConfigured

        recipe = RecipeFactory(name='unchanged', signed=True)
        original_signature = recipe.signature
        recipe.update(name='changed')
        assert recipe.name == 'changed'
        assert recipe.signature is not original_signature
        assert recipe.signature is None

    def test_setting_signature_doesnt_change_canonical_json(self):
        recipe = RecipeFactory(name='unchanged', signed=False)
        serialized = recipe.canonical_json()
        recipe.signature = SignatureFactory()
        recipe.save()
        assert recipe.signature is not None
        assert recipe.canonical_json() == serialized

    def test_cant_change_signature_and_other_fields(self):
        recipe = RecipeFactory(name='unchanged', signed=False)
        recipe.signature = SignatureFactory()
        with pytest.raises(ValidationError) as exc_info:
            recipe.update(name='changed')
        assert exc_info.value.message == 'Signatures must change alone'

    def test_update_signature(self, mocker, mock_logger):
        # Mock the Autographer
        mock_autograph = mocker.patch('normandy.recipes.models.Autographer')
        mock_autograph.return_value.sign_data.return_value = [
            {'signature': 'fake signature'},
        ]

        recipe = RecipeFactory(signed=False)
        recipe.update_signature()
        mock_logger.info.assert_called_with(
            Whatever.contains(str(recipe.id)),
            extra={'code': INFO_REQUESTING_RECIPE_SIGNATURES, 'recipe_ids': [recipe.id]}
        )

        recipe.save()
        assert recipe.signature is not None
        assert recipe.signature.signature == 'fake signature'

    def test_signatures_update_correctly_on_enable(self, mocker):
        mock_autograph = mocker.patch('normandy.recipes.models.Autographer')

        def fake_sign(datas):
            sigs = []
            for d in datas:
                sigs.append({'signature': hashlib.sha256(d).hexdigest()})
            return sigs

        mock_autograph.return_value.sign_data.side_effect = fake_sign

        recipe = RecipeFactory(enabled=False, signed=False)
        recipe.enabled = True
        recipe.save()
        recipe.refresh_from_db()

        assert recipe.signature is not None
        assert recipe.signature.signature == hashlib.sha256(recipe.canonical_json()).hexdigest()

    def test_recipe_update_partial(self):
        a1 = ActionFactory()
        recipe = RecipeFactory(name='unchanged', action=a1, arguments={'message': 'something'},
                               extra_filter_expression='something !== undefined')
        a2 = ActionFactory()
        c = ChannelFactory(slug='beta')
        recipe.update(name='changed', action=a2, channels=[c])
        assert recipe.action == a2
        assert recipe.name == 'changed'
        assert recipe.arguments == {'message': 'something'}
        assert recipe.filter_expression == ("(normandy.channel in ['beta']) && "
                                            "(something !== undefined)")

    def test_recipe_doesnt_update_when_clean(self):
        channel = ChannelFactory()
        recipe = RecipeFactory(name='my name', channels=[channel])

        revision_id = recipe.revision_id
        last_updated = recipe.last_updated

        recipe.update(name='my name', channels=[channel])
        assert revision_id == recipe.revision_id
        assert last_updated == recipe.last_updated

    def test_recipe_update_channels(self):
        c1 = ChannelFactory(slug='beta')
        recipe = RecipeFactory(channels=[c1])

        c2 = ChannelFactory(slug='release')
        recipe.update(channels=[c2])
        assert recipe.channels.count() == 1
        assert list(recipe.channels.all()) == [c2]

        recipe.update(channels=[c1, c2])
        channels = list(recipe.channels.all())
        assert recipe.channels.count() == 2
        assert c1 in channels
        assert c2 in channels

        recipe.update(channels=[])
        assert recipe.channels.count() == 0

    def test_recipe_update_countries(self):
        c1 = CountryFactory(code='CA')
        recipe = RecipeFactory(countries=[c1])

        c2 = CountryFactory(code='US')
        recipe.update(countries=[c2])
        assert recipe.countries.count() == 1
        assert list(recipe.countries.all()) == [c2]

        recipe.update(countries=[c1, c2])
        countries = list(recipe.countries.all())
        assert recipe.countries.count() == 2
        assert c1 in countries
        assert c2 in countries

        recipe.update(countries=[])
        assert recipe.countries.count() == 0

    def test_recipe_update_locales(self):
        l1 = LocaleFactory(code='en-US')
        recipe = RecipeFactory(locales=[l1])

        l2 = LocaleFactory(code='fr-CA')
        recipe.update(locales=[l2])
        assert recipe.locales.count() == 1
        assert list(recipe.locales.all()) == [l2]

        recipe.update(locales=[l1, l2])
        locales = list(recipe.locales.all())
        assert recipe.locales.count() == 2
        assert l1 in locales
        assert l2 in locales

        recipe.update(locales=[])
        assert recipe.locales.count() == 0

    def test_recipe_update_arguments(self):
        recipe = RecipeFactory(arguments_json='{}')
        recipe.update(arguments={'something': 'value'})
        assert recipe.arguments_json == '{"something": "value"}'

    def test_recipe_force_update(self):
        recipe = RecipeFactory(name='my name')
        revision_id = recipe.revision_id
        recipe.update(name='my name', force=True)
        assert revision_id != recipe.revision_id

    def test_update_logging(self, mock_logger):
        recipe = RecipeFactory(name='my name')
        recipe.update(name='my name', force=True)
        mock_logger.info.assert_called_with(
            Whatever.contains(str(recipe.id)),
            extra={'code': INFO_CREATE_REVISION}
        )

    def test_revision_id_changes(self):
        """Ensure that the revision id is incremented on each save"""
        recipe = RecipeFactory()
        revision_id = recipe.revision_id
        recipe.update(action=ActionFactory())
        assert recipe.revision_id != revision_id


@pytest.mark.django_db
class TestRecipeQueryset(object):
    def test_update_signatures(self, mocker, mock_logger):
        # Make sure the test environment is clean. This test is invalid otherwise.
        assert Recipe.objects.all().count() == 0

        # Mock the Autographer
        mock_autograph = mocker.patch('normandy.recipes.models.Autographer')
        mock_autograph.return_value.sign_data.return_value = [
            {'signature': 'fake signature 1'},
            {'signature': 'fake signature 2'},
        ]

        # Make and sign two recipes
        (recipe1, recipe2) = RecipeFactory.create_batch(2)
        Recipe.objects.all().update_signatures()

        # Assert that the signature update is logged.
        mock_logger.info.assert_called_with(
            Whatever.contains(str(recipe1.id), str(recipe2.id)),
            extra={
                'code': INFO_REQUESTING_RECIPE_SIGNATURES,
                'recipe_ids': Whatever.contains(recipe1.id, recipe2.id)
            }
        )

        # Assert the autographer was used as expected
        assert mock_autograph.called
        assert mock_autograph.return_value.sign_data.called_with([Whatever(), Whatever()])
        signatures = list(Recipe.objects.all().values_list('signature__signature', flat=True))
        assert signatures == ['fake signature 1', 'fake signature 2']


class TestClient(object):
    def test_geolocation(self, rf, settings):
        settings.NUM_PROXIES = 1
        req = rf.post('/', X_FORWARDED_FOR='fake, 1.1.1.1', REMOTE_ADDR='2.2.2.2')
        client = Client(req)

        with patch('normandy.recipes.models.get_country_code') as get_country_code:
            assert client.country == get_country_code.return_value
            assert get_country_code.called_with('1.1.1.1')

    def test_initial_values(self, rf):
        """Ensure that computed properties can be overridden."""
        req = rf.post('/', X_FORWARDED_FOR='fake, 1.1.1.1', REMOTE_ADDR='2.2.2.2')
        client = Client(req, country='FAKE', request_time='FAKE')
        assert client.country == 'FAKE'
        assert client.request_time == 'FAKE'
