import json
from random import randint

import pytest
from requests.exceptions import ConnectionError
from django.core.exceptions import PermissionDenied
from django.contrib.auth.models import User

from normandy.base.middleware import (
    NormandyCommonMiddleware,
    NormandySecurityMiddleware,
    DEBUG_HTTP_TO_HTTPS_REDIRECT,
    OIDCAccessTokenAuthorizationMiddleware,
    OIDCEndpointRequestError,
)


@pytest.fixture
def mock_logger(mocker):
    return mocker.patch('normandy.base.middleware.logger')


class TestNormandyCommonMiddleware(object):

    def test_append_slash_redirects_with_cache_headers(self, rf, settings):
        cache_time = randint(100, 1000)
        # This must be a URL that is valid with a slash but not without a slash
        url = '/api/v1'
        settings.APPEND_SLASH = True
        settings.PERMANENT_REDIRECT_CACHE_TIME = cache_time

        middleware = NormandyCommonMiddleware()
        req = rf.get(url)
        res = middleware.process_request(req)

        assert res is not None
        assert res.status_code == 301
        assert res['Location'] == url + '/'
        cache_control = set(res['Cache-Control'].split(', '))
        assert cache_control == {'public', f'max-age={cache_time}'}


class TestNormandySecurityMiddleware(object):

    @pytest.fixture
    def enable_ssl_redirect(self, settings):
        settings.SECURE_SSL_REDIRECT = True
        settings.SECURE_REDIRECT_EXEMPT = []

    def test_it_works(self, rf, enable_ssl_redirect):
        middleware = NormandySecurityMiddleware()
        req = rf.get('/', secure=False)
        res = middleware.process_request(req)

        assert res is not None
        assert res.status_code == 301
        assert res['Location'].startswith('https:')

    def test_it_includes_cache_headers(self, rf, enable_ssl_redirect, settings):
        cache_time = randint(100, 1000)
        settings.HTTPS_REDIRECT_CACHE_TIME = cache_time

        middleware = NormandySecurityMiddleware()
        req = rf.get('/', secure=False)
        res = middleware.process_request(req)

        cache_control = set(res['Cache-Control'].split(', '))
        assert cache_control == {'public', f'max-age={cache_time}'}

    def test_it_logs(self, rf, enable_ssl_redirect, mock_logger):
        middleware = NormandySecurityMiddleware()
        req = rf.post(
            path='/',
            data='this is the body',
            content_type='text/plain',
            HTTP_X_HELLO='world',
            secure=False,
        )
        middleware.process_request(req)

        mock_logger.debug.assert_called_with(
            'Served HTTP to HTTPS redirect for /',
            extra={
                'code': DEBUG_HTTP_TO_HTTPS_REDIRECT,
                'method': 'POST',
                'path': '/',
                'body': 'this is the body',
                'headers': {
                    'X_HELLO': 'world',
                    'CONTENT_TYPE': 'text/plain',
                    'CONTENT_LENGTH': 16,
                    'COOKIE': '',
                },
            }
        )


class TestOIDCAccessTokenAuthenticationMiddleware:

    @pytest.fixture
    def middleware(self):
        return OIDCAccessTokenAuthorizationMiddleware(
            lambda req: 'response'
        )

    @pytest.mark.django_db
    def test_happy_path(
        self,
        middleware,
        rf,
        requestsmock,
        settings,
    ):
        user_profile = {
            'email': 'Peterbe@example.com ',  # note the trailing space
            'given_name': 'Peter ',
            'family_name': 'Bengtsson',
        }
        requestsmock.get(
            settings.OIDC_USER_ENDPOINT,
            content=json.dumps(user_profile).encode('utf-8'),
        )
        req = rf.get('/', HTTP_AUTHORIZATION='Bearer perfectly-valid')
        res = middleware(req)
        assert res == 'response'  # Meaning, it didn't interfer the response
        # This should have created a user
        user = User.objects.get()
        # The middleware sets `request.user = found_user`
        assert req.user
        user = req.user
        assert user.email == 'peterbe@example.com'
        assert user.username == 'peterbe@example.com'
        assert user.first_name == 'Peter'
        assert user.last_name == 'Bengtsson'
        assert not user.is_staff
        assert not user.is_superuser
        # Also, sanity check that the user got created
        assert User.objects.get().username == 'peterbe@example.com'

    @pytest.mark.django_db
    def test_happy_path_user_already_exists(
        self,
        middleware,
        rf,
        requestsmock,
        settings,
    ):
        existing_user = User.objects.create(
            username='anything',
            email='peterbe@example.com'
        )
        assert not existing_user.last_login
        user_profile = {
            'email': 'Peterbe@example.com ',  # note the trailing space
            'given_name': 'Peter ',
            'family_name': 'Bengtsson',
        }
        requestsmock.get(
            settings.OIDC_USER_ENDPOINT,
            content=json.dumps(user_profile).encode('utf-8'),
        )
        req = rf.get('/', HTTP_AUTHORIZATION='Bearer perfectly-valid')
        middleware(req)
        existing_user.refresh_from_db()
        assert existing_user.last_login

    def test_nothing_if_no_header(self, middleware, rf):
        req = rf.get('/')
        res = middleware(req)
        # This means, nothing happened in the middleware's process_request()
        assert res == 'response'
        # Same if it's set but empty
        req = rf.get('/', HTTP_AUTHORIZATION='')
        res = middleware(req)
        assert res == 'response'

    def test_bad_bearer_token(self, middleware, rf):
        req = rf.get('/', HTTP_AUTHORIZATION='Any old junk')
        with pytest.raises(PermissionDenied) as err:
            middleware(req)
        assert 'Invalid Authorization header value' in str(err)

    def test_bad_access_token(
        self,
        middleware,
        rf,
        requestsmock,
        settings,
    ):
        requestsmock.get(
            settings.OIDC_USER_ENDPOINT,
            status_code=401,
        )
        req = rf.get('/', HTTP_AUTHORIZATION='Bearer notgoodenough')
        with pytest.raises(PermissionDenied) as err:
            middleware(req)
        assert 'Unauthorized access token' in str(err)

    def test_oidc_provider_unhappy(
        self,
        middleware,
        rf,
        requestsmock,
        settings,
    ):
        """If the communication between our server and the OIDC provider works but
        the response is a 4xx error (but not 401) then an error will be raise."""
        requestsmock.get(
            settings.OIDC_USER_ENDPOINT,
            status_code=400,
        )
        req = rf.get('/', HTTP_AUTHORIZATION='Bearer perfectly-valid')
        with pytest.raises(OIDCEndpointRequestError) as err:
            middleware(req)
        assert '400' in str(err), str(err)

    @pytest.mark.django_db
    def test_oidc_provider_retries_on_5xx_errors(
        self,
        middleware,
        rf,
        requestsmock,
        settings,
    ):
        # This will cause a retry
        requestsmock.get(
            settings.OIDC_USER_ENDPOINT,
            status_code=504,
        )
        user_profile = {
            'email': 'Peterbe@example.com',
            'given_name': 'Peter ',
            'family_name': 'Bengtsson',
        }
        requestsmock.get(
            settings.OIDC_USER_ENDPOINT,
            content=json.dumps(user_profile).encode('utf-8'),
        )
        req = rf.get('/', HTTP_AUTHORIZATION='Bearer notgoodenough')
        middleware(req)
        # The middleware sets `request.user = found_user`
        assert req.user

    @pytest.mark.django_db
    def test_oidc_provider_retries_on_request_connection_errors(
        self,
        middleware,
        rf,
        requestsmock,
        settings,
    ):
        # This will cause a retry
        requestsmock.get(
            settings.OIDC_USER_ENDPOINT,
            exc=ConnectionError,
        )
        user_profile = {
            'email': 'Peterbe@example.com',
            'given_name': 'Peter ',
            'family_name': 'Bengtsson',
        }
        requestsmock.get(
            settings.OIDC_USER_ENDPOINT,
            content=json.dumps(user_profile).encode('utf-8'),
        )
        req = rf.get('/', HTTP_AUTHORIZATION='Bearer notgoodenough')
        middleware(req)
        assert req.user
