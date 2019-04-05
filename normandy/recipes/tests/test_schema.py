import pytest

from normandy.base.tests import GQ
from normandy.recipes.tests import ActionFactory, ApprovalRequestFactory, RecipeFactory


@pytest.mark.django_db
class TestQuery(object):
    def test_resolve_all_action(self, gql_client):
        a = ActionFactory()
        res = gql_client.execute(GQ().query.allActions.fields("id"))
        assert res == {"data": {"allActions": [{"id": str(a.id)}]}}

    def test_resolve_action_by_id(self, gql_client):
        a = ActionFactory()
        res = gql_client.execute(GQ().query.action(id=a.id).fields("name"))
        assert res == {"data": {"action": {"name": a.name}}}

    def test_resolve_action_by_name(self, gql_client):
        a = ActionFactory()
        res = gql_client.execute(GQ().query.action(name=a.name).fields("id"))
        assert res == {"data": {"action": {"id": str(a.id)}}}

    def test_resolve_all_approval_requests(self, gql_client):
        a = ApprovalRequestFactory()
        res = gql_client.execute(GQ().query.allApprovalRequests.fields("id"))
        assert res == {"data": {"allApprovalRequests": [{"id": str(a.id)}]}}

    def test_resolve_approval_request_by_id(self, gql_client):
        a = ApprovalRequestFactory()
        res = gql_client.execute(
            GQ().query.approvalRequest(id=a.id).fields(GQ().revision.fields("id"))
        )
        assert res == {"data": {"approvalRequest": {"revision": {"id": str(a.revision.id)}}}}

    def test_resolve_all_recipes(self, gql_client):
        r = RecipeFactory()
        res = gql_client.execute(GQ().query.allRecipes.fields("id"))
        assert res == {"data": {"allRecipes": [{"id": str(r.id)}]}}

    def test_resolve_recipe_by_id(self, gql_client):
        r = RecipeFactory()
        res = gql_client.execute(
            GQ().query.recipe(id=r.id).fields(GQ().latestRevision.fields("id"))
        )
        assert res == {"data": {"recipe": {"latestRevision": {"id": str(r.latest_revision.id)}}}}

    def test_resolve_all_recipe_revisions(self, gql_client):
        r = RecipeFactory()
        res = gql_client.execute(GQ().query.allRecipeRevisions.fields("id"))
        assert res == {"data": {"allRecipeRevisions": [{"id": str(r.latest_revision.id)}]}}

    def test_resolve_recipe_revision_by_id(self, gql_client):
        r = RecipeFactory()
        res = gql_client.execute(GQ().query.recipeRevision(id=r.latest_revision.id).fields("id"))
        assert res == {"data": {"recipeRevision": {"id": str(r.latest_revision.id)}}}
