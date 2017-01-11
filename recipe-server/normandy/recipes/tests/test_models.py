import hashlib
from unittest.mock import patch

from django.core.exceptions import ImproperlyConfigured, ValidationError

import pytest

from normandy.base.tests import Whatever
from normandy.recipes.models import Client, Recipe
from normandy.recipes.tests import (
    ActionFactory,
    RecipeFactory,
    SignatureFactory,
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

    def test_canonical_json(self):
        recipe = RecipeFactory(
            action=ActionFactory(name='action'),
            arguments_json='{"foo": 1, "bar": 2}',
            enabled=False,
            filter_expression='2 + 2 == 4',
            name='canonical',
        )
        # Yes, this is really ugly, but we really do need to compare an exact
        # byte sequence, since this is used for hashing and signing
        expected = (
            '{'
            '"action":"action",'
            '"arguments":{"bar":2,"foo":1},'
            '"enabled":false,'
            '"filter_expression":"2 + 2 == 4",'
            '"id":%(id)s,'
            '"last_updated":"%(last_updated)s",'
            '"name":"canonical",'
            '"revision_id":"%(revision_id)s"'
            '}'
        ) % {
            'id': recipe.id,
            'revision_id': recipe.revision_id,
            'last_updated': recipe.last_updated.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
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

    def test_update_signature(self, mocker):
        # Mock the Autographer
        mock_autograph = mocker.patch('normandy.recipes.models.Autographer')
        mock_autograph.return_value.sign_data.return_value = [
            {'signature': 'fake signature'},
        ]

        recipe = RecipeFactory(signed=False)
        recipe.update_signature()
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
                               filter_expression='something !== undefined')
        a2 = ActionFactory()
        recipe.update(name='changed', action=a2)
        assert recipe.action == a2
        assert recipe.name == 'changed'
        assert recipe.arguments == {'message': 'something'}
        assert recipe.filter_expression == 'something !== undefined'

    def test_recipe_doesnt_update_when_clean(self):
        recipe = RecipeFactory(name='my name')
        revision_id = recipe.revision_id
        recipe.update(name='my name')
        assert revision_id == recipe.revision_id

    def test_recipe_force_update(self):
        recipe = RecipeFactory(name='my name')
        revision_id = recipe.revision_id
        recipe.update(name='my name', force=True)
        assert revision_id != recipe.revision_id

    def test_revision_id_changes(self):
        """Ensure that the revision id is incremented on each save"""
        recipe = RecipeFactory()
        revision_id = recipe.revision_id
        recipe.update(action=ActionFactory())
        assert recipe.revision_id != revision_id


@pytest.mark.django_db
class TestRecipeQueryset(object):
    def test_update_signatures(self, mocker):
        # Make sure the test environment is clean. This test is invalid otherwise.
        assert Recipe.objects.all().count() == 0
        # Mock the Autographer
        mock_autograph = mocker.patch('normandy.recipes.models.Autographer')
        mock_autograph.return_value.sign_data.return_value = [
            {'signature': 'fake signature 1'},
            {'signature': 'fake signature 2'},
        ]
        # Make and sign two recipes
        RecipeFactory.create_batch(2)
        Recipe.objects.all().update_signatures()
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
