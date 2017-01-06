import pytest

from normandy.recipes.tests import ActionFactory


@pytest.mark.django_db
class TestActionAdmin(object):
    def test_it_works(self, admin_client):
        res = admin_client.get('/admin/recipes/action/')
        assert res.status_code == 200

    def test_it_works_with_actions(self, admin_client):
        ActionFactory()
        res = admin_client.get('/admin/recipes/action/')
        assert res.status_code == 200
