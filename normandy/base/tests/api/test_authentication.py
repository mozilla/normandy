import json
import pytest
import time

from datetime import datetime

from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.test import APIClient
from rest_framework.views import APIView

from django.conf.urls import url
from django.core.cache import cache

from normandy.base.tests import UserFactory
from normandy.base.api.authentication import BearerTokenAuthentication, InsecureEmailAuthentication


class MockView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def make_response(self, request):
        return Response({"user": request.user.email})

    def get(self, request):
        return self.make_response(request)

    def post(self, request):
        return self.make_response(request)

    def put(self, request):
        return self.make_response(request)


urlpatterns = [
    url(r"^bearer/$", MockView.as_view(authentication_classes=[BearerTokenAuthentication])),
    url(r"^insecure/$", MockView.as_view(authentication_classes=[InsecureEmailAuthentication])),
]


@pytest.mark.django_db
@pytest.mark.urls("normandy.base.tests.api.test_authentication")
class TestBearerTokenAuthentication(object):
    """Bearer token authentication"""

    @pytest.fixture(autouse=True)
    def clear_cache(self):
        cache.clear()

    @pytest.fixture
    def csrf_api_client(self):
        return APIClient(enforce_csrf_checks=True)

    @pytest.fixture
    def mock_oidc(self, settings, requestsmock):
        def fn(user=None, **kwargs):
            if user:
                user_profile = {
                    "email": user.email,
                    "given_name": user.first_name,
                    "family_name": user.last_name,
                }
                kwargs["content"] = json.dumps(user_profile).encode("utf-8")

            requestsmock.get(settings.OIDC_USER_ENDPOINT, **kwargs)

        return fn

    def test_it_works(self, csrf_api_client, mock_oidc):
        mock_oidc(
            content=json.dumps(
                {"email": "john.doe@example.com", "given_name": "John", "family_name": "Doe"}
            ).encode("utf-8")
        )
        response = csrf_api_client.post(
            "/bearer/", {"example": "example"}, HTTP_AUTHORIZATION="Bearer valid-token"
        )
        assert response.status_code == 200
        assert response.data.get("user") == "john.doe@example.com"

    def test_caching(self, csrf_api_client, requestsmock, settings):
        user = UserFactory()
        user_data = json.dumps(
            {"email": user.email, "given_name": user.first_name, "family_name": user.last_name}
        ).encode("utf-8")

        # The reason for the `+ 2` here is that if we only add +1 second, there's a small
        # chance that the `time.mktime(utcnow)` done here is *different* from the
        # `time.mktime(utcnow)` that happens within the `fetch_oidc_user_profile()` method
        # inside BearerTokenAuthentication.
        # I.e.
        #
        #    print(time.mktime(datetime.utcnow().timetuple()))  # outputs 1534380068.0
        #    time.sleep(0.1)
        #    print(time.mktime(datetime.utcnow().timetuple()))  # outputs 1534380069.0
        #
        # Note! This doesn't always happen. Run those three lines 100 times and it's
        # guaranteed to be different ~10% of the time. That's when the milliseconds is 900 and
        # with the sleep(0.1) it will round up to the next second.
        # By adding +2 to the mock here we allow a whole 1 second between now and when
        # the `fetch_oidc_user_profile()` uses `time.mktime(datetime.utcnow().timetuple())`.
        ratelimit_reset = int(time.mktime(datetime.utcnow().timetuple())) + 2
        requestsmock.get(
            settings.OIDC_USER_ENDPOINT,
            [
                {
                    "content": user_data,
                    "status_code": 200,
                    "headers": {"X-RateLimit-Reset": f"{ratelimit_reset}"},
                },
                {"status_code": 401},
            ],
        )

        response = csrf_api_client.post(
            "/bearer/", {"example": "example"}, HTTP_AUTHORIZATION="Bearer valid-token"
        )
        assert response.status_code == 200
        assert response.data.get("user") == user.email

        # Response should be cached and you shouldn't hit the 401
        response = csrf_api_client.post(
            "/bearer/", {"example": "example"}, HTTP_AUTHORIZATION="Bearer valid-token"
        )
        assert response.status_code == 200
        assert response.data.get("user") == user.email

        # Sleep till cache expires
        time.sleep(2)
        response = csrf_api_client.post(
            "/bearer/", {"example": "example"}, HTTP_AUTHORIZATION="Bearer valid-token"
        )
        assert response.status_code == 401

    def test_user_exists(self, csrf_api_client, mock_oidc):
        user = UserFactory()
        mock_oidc(user=user)
        response = csrf_api_client.get("/bearer/", HTTP_AUTHORIZATION="Bearer valid-token")
        assert response.status_code == 200
        assert response.data.get("user") == user.email

    def test_user_is_not_active(self, csrf_api_client, mock_oidc):
        user = UserFactory(username="test@example.com", email="test@example.com", is_active=False)
        mock_oidc(user=user)
        response = csrf_api_client.post(
            "/bearer/", {"example": "example"}, HTTP_AUTHORIZATION="Bearer valid-token"
        )
        assert response.status_code == 401, (response.data, response.user)

    def test_bad_access_token(self, csrf_api_client, mock_oidc):
        mock_oidc(status_code=401)
        response = csrf_api_client.post(
            "/bearer/", {"example": "example"}, HTTP_AUTHORIZATION="Bearer invalid-token"
        )
        assert response.status_code == 401

    def test_no_token(self, csrf_api_client, mock_oidc):
        user = UserFactory()
        mock_oidc(user=user)
        response = csrf_api_client.post("/bearer/", {"example": "example"})
        assert response.status_code == 401

    def test_oidc_provider_400_error(self, csrf_api_client, mock_oidc):
        mock_oidc(status_code=400)
        response = csrf_api_client.post(
            "/bearer/", {"example": "example"}, HTTP_AUTHORIZATION="Bearer valid-token"
        )
        assert response.status_code == 401
        assert response.data.get("detail") == "Unable to verify bearer token."

    def test_retry_on_5xx_error(self, csrf_api_client, settings, requestsmock, caplog):
        user = UserFactory()
        user_data = json.dumps(
            {"email": user.email, "given_name": user.first_name, "family_name": user.last_name}
        ).encode("utf-8")

        requestsmock.get(
            settings.OIDC_USER_ENDPOINT,
            [
                {"status_code": 504},
                {"status_code": 504},
                {"content": user_data, "status_code": 200},
            ],
        )

        response = csrf_api_client.get("/bearer/", HTTP_AUTHORIZATION="Bearer valid-token")
        assert response.status_code == 200
        assert response.data.get("user") == user.email

        # Count the number of retries
        retry_count = 0
        expected_message = "requests.exceptions.RequestException: 504 on {}".format(
            settings.OIDC_USER_ENDPOINT
        )
        for record in caplog.records:
            if expected_message in record.message:
                retry_count += 1

        assert retry_count == 2

    def test_max_retries_on_5xx_error(self, csrf_api_client, settings, requestsmock, caplog):
        requestsmock.get(
            settings.OIDC_USER_ENDPOINT,
            [
                {"status_code": 504},
                {"status_code": 504},
                {"status_code": 504},
                {"status_code": 504},
                {"status_code": 504},
                {"status_code": 504},
                {"status_code": 504},
            ],
        )

        response = csrf_api_client.get("/bearer/", HTTP_AUTHORIZATION="Bearer valid-token")
        assert response.status_code == 401
        assert response.data.get("detail") == "Unable to verify bearer token."

        # Count the number of retries
        retry_count = 0
        expected_message = "requests.exceptions.RequestException: 504 on {}".format(
            settings.OIDC_USER_ENDPOINT
        )
        for record in caplog.records:
            if expected_message in record.message:
                retry_count += 1

        assert retry_count == 5

    def test_existing_user_with_no_email(self, csrf_api_client, mock_oidc):
        user = UserFactory(username="john.doe@example.com", email="")
        mock_oidc(
            content=json.dumps(
                {"email": "john.doe@example.com", "given_name": "John", "family_name": "Doe"}
            ).encode("utf-8")
        )
        response = csrf_api_client.post(
            "/bearer/", {"example": "example"}, HTTP_AUTHORIZATION="Bearer valid-token"
        )
        assert response.status_code == 200
        assert response.data.get("user") == "john.doe@example.com"

        user.refresh_from_db()
        assert user.email == "john.doe@example.com"


@pytest.mark.django_db
@pytest.mark.urls("normandy.base.tests.api.test_authentication")
class TestInsecureEmailAuthentication(object):
    """Bearer token authentication"""

    @pytest.fixture(autouse=True)
    def clear_cache(self):
        cache.clear()

    @pytest.fixture
    def bare_api_client(self):
        return APIClient()

    def test_it_works(self, bare_api_client):
        response = bare_api_client.post(
            "/insecure/",
            {"example": "example"},
            HTTP_AUTHORIZATION="Insecure john.doe@example.com",
        )
        assert response.status_code == 200
        assert response.data.get("user") == "john.doe@example.com"

    def test_user_exists(self, bare_api_client):
        user = UserFactory()
        response = bare_api_client.get("/insecure/", HTTP_AUTHORIZATION=f"Insecure {user.email}")
        assert response.status_code == 200
        assert response.data.get("user") == user.email

    def test_user_is_not_active(self, bare_api_client):
        user = UserFactory(username="test@example.com", email="test@example.com", is_active=False)
        response = bare_api_client.post(
            "/insecure/", {"example": "example"}, HTTP_AUTHORIZATION=f"Insecure {user.email}"
        )
        assert response.status_code == 401, (response.data, response.user)
