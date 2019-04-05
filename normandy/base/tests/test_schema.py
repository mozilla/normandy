import pytest

from normandy.base.tests import GQ, GroupFactory, UserFactory


class TestGQ(object):
    """Test the GQ query composer helper"""

    def test_simple_build(self):
        assert str(GQ("query")) == "query"
        assert str(GQ("query", attrs={"id": 1})) == "query(id: 1)"

    def test_compose(self):
        assert str(GQ().query) == "query"
        assert (
            str(GQ().query.user(id=1).fields("id", "name")) == "query { user(id: 1) { id, name } }"
        )

    def test_nested_object_in_fields(self):
        assert (
            GQ().query.users.fields("id", GQ("group").fields("id"))
        ) == "query { users { id, group { id } } }"


@pytest.mark.django_db
class TestQuery(object):
    def test_resolve_all_users(self, gql_client):
        u = UserFactory()
        res = gql_client.execute(GQ().query.allUsers.fields("id"))
        assert res == {"data": {"allUsers": [{"id": str(u.id)}]}}

    def test_resolve_user_by_id(self, gql_client):
        u = UserFactory()
        res = gql_client.execute(GQ().query.user(id=u.id).fields("username"))
        assert res == {"data": {"user": {"username": u.username}}}

    def test_resolve_user_by_username(self, gql_client):
        u = UserFactory()
        res = gql_client.execute(GQ().query.user(username=u.username).fields("id"))
        assert res == {"data": {"user": {"id": str(u.id)}}}

    def test_resolve_user_by_email(self, gql_client):
        u = UserFactory()
        res = gql_client.execute(GQ().query.user(email=u.email).fields("id"))
        assert res == {"data": {"user": {"id": str(u.id)}}}

    def test_resolve_all_groups(self, gql_client):
        g = GroupFactory()
        res = gql_client.execute(GQ().query.allGroups.fields("id"))
        assert res == {"data": {"allGroups": [{"id": str(g.id)}]}}

    def test_resolve_group_by_id(self, gql_client):
        g = GroupFactory()
        res = gql_client.execute(GQ().query.group(id=g.id).fields("name"))
        assert res == {"data": {"group": {"name": g.name}}}

    def test_resolve_group_by_name(self, gql_client):
        g = GroupFactory()
        res = gql_client.execute(GQ().query.group(name=g.name).fields("id"))
        assert res == {"data": {"group": {"id": str(g.id)}}}
