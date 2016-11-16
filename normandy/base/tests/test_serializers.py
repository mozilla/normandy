import pytest

from normandy.base.tests import Whatever, TokenFactory
from normandy.base.api.serializers import TokenSerializer


@pytest.mark.django_db()
class TestTokenSerializer:
    def test_it_works(self):
        token = TokenFactory()
        serializer = TokenSerializer(token)

        assert serializer.data == {
            'key': token.key,
            'created': Whatever(lambda s: isinstance(s, str)),
            'user': token.user.username,
        }
