import pytest

from django.contrib.auth.models import User


@pytest.mark.django_db
class TestUserAPI(object):
    def test_it_works(self, api_client):
        res = api_client.get('/api/v1/user/')
        user = User.objects.first()  # Get the default user
        assert res.status_code == 200
        assert res.data == [
            {
                'id': user.id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email
            }
        ]
