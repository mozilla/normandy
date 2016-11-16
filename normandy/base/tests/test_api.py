import pytest
from rest_framework.authtoken.models import Token

from normandy.base.tests import Whatever, TokenFactory


@pytest.mark.django_db
class TestTokenAPI(object):
    def test_it_gets_existing_tokens(self, api_client):
        token = TokenFactory(user=api_client.user)
        res = api_client.get('/api/v1/token/')
        assert res.status_code == 200
        assert res.data == {
            'key': token.key,
            'created': Whatever(),
            'user': api_client.user.username,
        }

    def test_it_creates_new_tokens(self, api_client):
        res = api_client.get('/api/v1/token/')
        assert res.status_code == 201
        assert res.data['user'] == api_client.user.username

    def test_it_deletes_existing_tokens(self, api_client):
        TokenFactory(user=api_client.user)
        assert Token.objects.all().count() == 1
        res = api_client.delete('/api/v1/token/')
        assert res.status_code == 204
        assert Token.objects.all().count() == 0

    def test_it_404s_when_deleting_nonexistant_tokens(self, api_client):
        res = api_client.delete('/api/v1/token/')
        assert res.status_code == 404
