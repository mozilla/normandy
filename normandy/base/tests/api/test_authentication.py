import json
import pytest

from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.test import APIClient
from rest_framework.views import APIView

from django.conf.urls import url

from normandy.base.tests import UserFactory
from normandy.base.api.authentication import BearerTokenAuthentication


class MockView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def make_response(self, request):
        return Response({'user': request.user.email})

    def get(self, request):
        return self.make_response(request)

    def post(self, request):
        return self.make_response(request)

    def put(self, request):
        return self.make_response(request)


urlpatterns = [
    url(
        r'^bearer/$',
        MockView.as_view(authentication_classes=[BearerTokenAuthentication])
    ),
]


@pytest.mark.django_db
@pytest.mark.urls('normandy.base.tests.api.test_authentication')
class TestBearerTokenAuthentication(object):
    """Bearer token authentication"""

    @pytest.fixture
    def csrf_api_client(self):
        return APIClient(enforce_csrf_checks=True)

    @pytest.fixture
    def mock_oidc(self, settings, requestsmock):
        def fn(user=None, **kwargs):
            if user:
                user_profile = {
                    'email': user.email,
                    'given_name': user.first_name,
                    'family_name': user.last_name,
                }
                kwargs['content'] = json.dumps(user_profile).encode('utf-8')

            requestsmock.get(settings.OIDC_USER_ENDPOINT, **kwargs)

        return fn

    def test_it_works(self, csrf_api_client, mock_oidc):
        mock_oidc(
            content=json.dumps({
                'email': 'john.doe@email.com',
                'given_name': 'John',
                'family_name': 'Doe',
            }).encode('utf-8')
        )
        response = csrf_api_client.post('/bearer/', {'example': 'example'},
                                        HTTP_AUTHORIZATION='Bearer valid-token')
        assert response.status_code == 200
        assert response.data.get('user') == 'john.doe@email.com'

    def test_user_exists(self, csrf_api_client, mock_oidc):
        user = UserFactory()
        mock_oidc(user=user)
        response = csrf_api_client.get('/bearer/', HTTP_AUTHORIZATION='Bearer valid-token')
        assert response.status_code == 200
        assert response.data.get('user') == user.email

    def test_user_is_not_active(self, csrf_api_client, mock_oidc):
        mock_oidc(user=UserFactory(is_active=False))
        response = csrf_api_client.post('/bearer/', {'example': 'example'},
                                        HTTP_AUTHORIZATION='Bearer valid-token')
        assert response.status_code == 401

    def test_bad_access_token(self, csrf_api_client, mock_oidc):
        mock_oidc(status_code=401)
        response = csrf_api_client.post('/bearer/', {'example': 'example'},
                                        HTTP_AUTHORIZATION='Bearer invalid-token')
        assert response.status_code == 401

    def test_no_token(self, csrf_api_client, mock_oidc):
        user = UserFactory()
        mock_oidc(user=user)
        response = csrf_api_client.post('/bearer/', {'example': 'example'})
        assert response.status_code == 401

    def test_oidc_provider_400_error(self, csrf_api_client, mock_oidc):
        mock_oidc(status_code=400)
        response = csrf_api_client.post('/bearer/', {'example': 'example'},
                                        HTTP_AUTHORIZATION='Bearer valid-token')
        assert response.status_code == 401
        assert response.data.get('detail') == 'Unable to verify bearer token.'

    def test_retry_on_5xx_error(self, csrf_api_client, settings, requestsmock, caplog):
        user = UserFactory()
        user_data = json.dumps({
            'email': user.email,
            'given_name': user.first_name,
            'family_name': user.last_name,
        }).encode('utf-8')

        requestsmock.get(settings.OIDC_USER_ENDPOINT, [
            {'status_code': 504},
            {'status_code': 504},
            {'content': user_data, 'status_code': 200},
        ])

        response = csrf_api_client.get('/bearer/', HTTP_AUTHORIZATION='Bearer valid-token')
        assert response.status_code == 200
        assert response.data.get('user') == user.email

        # Count the number of retries
        retry_count = 0
        expected_message = 'requests.exceptions.RequestException: 504 on {}'.format(
            settings.OIDC_USER_ENDPOINT)
        for record in caplog.records:
            if expected_message in record.message:
                retry_count += 1

        assert retry_count == 2

    def test_max_retries_on_5xx_error(self, csrf_api_client, settings, requestsmock, caplog):
        requestsmock.get(settings.OIDC_USER_ENDPOINT, [
            {'status_code': 504},
            {'status_code': 504},
            {'status_code': 504},
            {'status_code': 504},
            {'status_code': 504},
            {'status_code': 504},
            {'status_code': 504},
        ])

        response = csrf_api_client.get('/bearer/', HTTP_AUTHORIZATION='Bearer valid-token')
        assert response.status_code == 401
        assert response.data.get('detail') == 'Unable to verify bearer token.'

        # Count the number of retries
        retry_count = 0
        expected_message = 'requests.exceptions.RequestException: 504 on {}'.format(
            settings.OIDC_USER_ENDPOINT)
        for record in caplog.records:
            if expected_message in record.message:
                retry_count += 1

        assert retry_count == 5
