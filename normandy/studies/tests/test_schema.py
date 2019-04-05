import pytest

from normandy.base.tests import GQ
from normandy.studies.tests import ExtensionFactory


@pytest.mark.django_db
class TestQuery(object):
    def test_resolve_all_extensions(self, gql_client, storage):
        e = ExtensionFactory()
        res = gql_client.execute(GQ().query.allExtensions.fields("id"))
        assert res == {"data": {"allExtensions": [{"id": str(e.id)}]}}

    def test_resolve_extension_by_id(self, gql_client, storage):
        e = ExtensionFactory()
        res = gql_client.execute(GQ().query.extension(id=e.id).fields("name"))
        assert res == {"data": {"extension": {"name": e.name}}}
