import hashlib
from datetime import datetime, timedelta
from unittest.mock import patch

from django.core.exceptions import ImproperlyConfigured, ValidationError
from django.utils import timezone

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
    def test_revision_id_increments(self):
        """Ensure that the revision id is incremented on each save"""
        recipe = RecipeFactory()

        # The factory saves a couple times so revision id is not 0
        revision_id = recipe.revision_id

        recipe.action = ActionFactory()
        recipe.save()
        assert recipe.revision_id == revision_id + 1

    def test_revision_id_doesnt_increment_if_no_changes(self):
        """
        revision_id should not increment if a recipe is saved with no
        changes.
        """
        recipe = RecipeFactory()

        # The factory saves a couple times so revision id is not 0
        revision_id = recipe.revision_id

        recipe.save()
        assert recipe.revision_id == revision_id

    def test_skip_last_updated(self):
        # set last_updated to avoid timestamp precision problems
        recipe = RecipeFactory(name='one', last_updated=datetime.now() - timedelta(30))
        last_updated_1 = recipe.last_updated

        recipe.name = 'two'
        recipe.save()
        last_updated_2 = recipe.last_updated

        recipe.name = 'three'
        recipe.save(skip_last_updated=True)
        last_updated_3 = recipe.last_updated

        assert last_updated_1 != last_updated_2
        assert last_updated_2 == last_updated_3

    def test_canonical_json(self):
        recipe = RecipeFactory.build(
            action=ActionFactory(name='action'),
            arguments={'foo': 1, 'bar': 2},
            enabled=False,
            filter_expression='2 + 2 == 4',
            name='canonical',
            last_updated=datetime(2016, 6, 27, 13, 54, 51, 1234, tzinfo=timezone.utc),
        )
        recipe.save(skip_last_updated=True)
        # Yes, this is really ugly, but we really do need to compare an exact
        # byte sequence, since this is used for hashing and signing
        expected = (
            '{'
            '"action":"action",'
            '"arguments":{"bar":2,"foo":1},'
            '"enabled":false,'
            '"filter_expression":"2 + 2 == 4",'
            '"id":%(id)s,'
            '"is_approved":false,'
            '"last_updated":"2016-06-27T13:54:51.001234Z",'
            '"name":"canonical",'
            '"revision_id":%(revision_id)s'
            '}'
        ) % {
            'id': recipe.id,
            'revision_id': recipe.revision_id,
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

        recipe.name = 'changed'
        recipe.save()

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
        recipe.name = 'changed'
        recipe.save()
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
        recipe.name = 'changed'
        with pytest.raises(ValidationError) as exc_info:
            recipe.save()
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
