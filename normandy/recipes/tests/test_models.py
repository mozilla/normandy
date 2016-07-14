from datetime import datetime, timedelta
from unittest.mock import patch

from django.core.exceptions import ValidationError
from django.utils import timezone

import pytest

from normandy.base.tests import Whatever
from normandy.recipes.models import ApprovalRequest, Client, Recipe
from normandy.recipes.tests import (
    ActionFactory,
    ApprovalRequestFactory,
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

    def test_in_use(self):
        action = ActionFactory()
        assert not action.in_use

        RecipeFactory(action=action, enabled=False)
        assert not action.in_use

        RecipeFactory(action=action, enabled=True)
        assert action.in_use


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
            approval=None,
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
            '"approval":null,'
            '"arguments":{"bar":2,"foo":1},'
            '"current_approval_request":null,'
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

    def test_signature_is_invalidated(self):
        recipe = RecipeFactory(name='unchanged', signed=True)
        recipe.name = 'changed'
        recipe.save()
        recipe = Recipe.objects.get(id=recipe.id)
        assert recipe.signature is None
        assert recipe.name == 'changed'

    def test_setting_signature_doesnt_change_canonical_json(self):
        recipe = RecipeFactory(name='unchanged', signed=False)
        serialized = recipe.canonical_json()
        recipe.signature = SignatureFactory()
        recipe.save()
        recipe = Recipe.objects.get(id=recipe.id)
        assert recipe.signature is not None
        assert recipe.canonical_json() == serialized

    def test_cant_change_serializer_and_other_fields(self):
        recipe = RecipeFactory(name='unchanged', signed=False)
        recipe.signature = SignatureFactory()
        recipe.name = 'changed'
        with pytest.raises(ValidationError) as exc_info:
            recipe.save()
        assert exc_info.value.message == 'Signatures must change alone'


@pytest.mark.django_db
class TestRecipeQueryset(object):

    def test_update_signatures(self, mocker):
        # Make sure the test environment is clean. This test is invalid otherwise.
        assert Recipe.objects.all().count() == 0
        # Mock the Autographer
        mock_autograph = mocker.patch('normandy.recipes.models.Autographer')
        mock_autograph.return_value.sign_data.return_value = SignatureFactory.create_batch(2)
        # Make and sign two recipes
        RecipeFactory.create_batch(2)
        Recipe.objects.all().update_signatures()
        # Assert the autographer was used as expected
        assert mock_autograph.called
        assert mock_autograph.return_value.sign_data.called_with([Whatever(), Whatever()])
        signatures = list(Recipe.objects.all().values_list('signature__signature', flat=True))
        assert signatures == ['fake signature', 'fake signature']

@pytest.mark.django_db
class TestApprovalRequest(object):
    def test_only_one_open_request_for_recipe(self):
        recipe = RecipeFactory()
        ApprovalRequestFactory(recipe=recipe, active=False)

        # Should be able to create a new request because last one was not active
        ApprovalRequestFactory(recipe=recipe, active=True)

        # Should not be able to create a new request because an open request exists
        with pytest.raises(ApprovalRequest.ActiveRequestAlreadyExists):
            ApprovalRequestFactory(recipe=recipe, active=True)

    def test_can_save_open_request(self):
        request = ApprovalRequestFactory(active=True)

        # Should be able to call save without an integrity error
        request.save()


class TestClient(object):
    def test_geolocation(self, rf, settings):
        settings.NUM_PROXIES = 1
        req = rf.post('/', X_FORWARDED_FOR='fake, 1.1.1.1', REMOTE_ADDR='2.2.2.2')
        client = Client(req)

        with patch('normandy.recipes.models.get_country_code') as get_country_code:
            assert client.country == get_country_code.return_value
            assert get_country_code.called_with('1.1.1.1')
