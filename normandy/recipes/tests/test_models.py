from unittest.mock import patch

import pytest

from normandy.recipes.models import ApprovalRequest, Client
from normandy.recipes.tests import (
    ActionFactory,
    ApprovalRequestFactory,
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


@pytest.mark.django_db
class TestRecipe(object):
    def test_revision_id_increments(self):
        """Ensure that the revision id is incremented on each save"""
        recipe = RecipeFactory()

        # The factory saves a couple times so revision id is not 0
        revision_id = recipe.revision_id

        recipe.save()
        assert recipe.revision_id == revision_id + 1


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
