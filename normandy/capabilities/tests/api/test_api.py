import pytest

from normandy.recipes.tests import RecipeFactory


@pytest.mark.django_db
class TestServiceInfoView(object):
    def test_includes_baseline_capabilities(self, api_client, settings):
        res = api_client.get("/api/v3/capabilities/")

        assert res.status_code == 200
        for cap in settings.BASELINE_CAPABILITIES:
            assert res.data["capabilities"][cap]["is_baseline"]

    def test_recipe_capabilities_are_included(self, api_client, settings):
        recipe = RecipeFactory(extra_capabilities=["test-capability"])
        res = api_client.get("/api/v3/capabilities/")

        assert res.status_code == 200
        assert any(
            cap not in settings.BASELINE_CAPABILITIES
            for cap in recipe.latest_revision.capabilities
        )
        for cap in recipe.latest_revision.capabilities:
            assert cap in res.data["capabilities"]
            assert res.data["capabilities"][cap]["is_baseline"] == (
                cap in settings.BASELINE_CAPABILITIES
            )
