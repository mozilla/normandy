from datetime import datetime
from unittest.mock import patch, call

import pytest

from normandy.recipes.models import Action, Client
from normandy.recipes.tests import (
    ActionFactory,
    RecipeFactory,
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

    def test_update_signatures(self):
        action = ActionFactory()
        assert action.signature is None
        assert action.signature_timestamp is None
        queryset = Action.objects.filter(id=action.id)

        with patch('normandy.recipes.models.Autographer') as Autographer:
            Autographer.return_value.sign_data.return_value = ['fake signature']
            queryset.update_signatures()

        assert Autographer.mock_calls == [
            call(),  # Constructor
            call().sign_data([action.implementation]),
        ]

        action = queryset.get()
        assert action.signature == 'fake signature'
        assert isinstance(action.signature_timestamp, datetime)

    def test_signature_is_cleared_when_content_changes(self, settings):
        action = ActionFactory(
            implementation='original',
            signature='original',
            signature_timestamp=datetime.now())
        action.implementation = 'new'
        action.save()
        assert action.signature is None
        assert action.signature_timestamp is None


@pytest.mark.django_db
class TestRecipe(object):
    def test_revision_id_increments(self):
        """Ensure that the revision id is incremented on each save"""
        recipe = RecipeFactory()

        # The factory saves a couple times so revision id is not 0
        revision_id = recipe.revision_id

        recipe.save()
        assert recipe.revision_id == revision_id + 1


class TestClient(object):
    def test_geolocation(self, rf, settings):
        settings.NUM_PROXIES = 1
        req = rf.post('/', X_FORWARDED_FOR='fake, 1.1.1.1', REMOTE_ADDR='2.2.2.2')
        client = Client(req)

        with patch('normandy.recipes.models.get_country_code') as get_country_code:
            assert client.country == get_country_code.return_value
            assert get_country_code.called_with('1.1.1.1')
