import pytest

from normandy.base.tests import GQ, UserFactory


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
