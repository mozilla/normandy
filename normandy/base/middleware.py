import logging
import os
import re

from django import http
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.middleware import RemoteUserMiddleware
from django.contrib.auth.signals import user_logged_in
from django.core.exceptions import PermissionDenied
from django.utils import timezone
from django.utils.cache import patch_cache_control
from django.middleware.common import CommonMiddleware
from django.middleware.security import SecurityMiddleware

import backoff
import requests
from whitenoise.middleware import WhiteNoiseMiddleware


DEBUG_HTTP_TO_HTTPS_REDIRECT = 'normandy.base.middleware.D001'


logger = logging.getLogger(__name__)


def request_received_at_middleware(get_response):
    """
    Adds a 'received_at' property to requests with a datetime showing
    when the request was received by Django.
    """

    def middleware(request):
        request.received_at = timezone.now()
        return get_response(request)

    return middleware


class ConfigurableRemoteUserMiddleware(RemoteUserMiddleware):
    """
    Makes RemoteUserMiddleware customizable via settings.
    """

    @property
    def header(self):
        """
        Name of request header to grab username from.

        This will be the key as used in the request.META dictionary. To
        reference HTTP headers, this value should be all upper case and
        prefixed with "HTTP_".
        """
        return settings.OIDC_REMOTE_AUTH_HEADER


class NormandyWhiteNoiseMiddleware(WhiteNoiseMiddleware):

    def is_immutable_file(self, path, url):
        """
        Determine whether given URL represents an immutable file (i.e. a
        file with a hash of its contents as part of its name) which can
        therefore be cached forever
        """
        if not url.startswith(self.static_prefix):
            return False
        filename = os.path.basename(url)
        # Check if the filename ends with either 20 or 32 hex digits, and then an extension
        # 20 is for normal hashed content, like JS or CSS files, which use "[name].[hash].[ext]"
        # 32 is for content addressed files, like images or fonts, which use "[hash].[ext]"
        match = re.match(r'^.*([a-f0-9]{20}|[a-f0-9]{32})\.[\w\d]+$', filename)
        return bool(match)


class HttpResponsePermanentRedirectCached(http.HttpResponsePermanentRedirect):
    """
    Permanent redirect that also includes cache headers.

    This primarily helps our infrastructure stay reliable and
    performant, and softens "permanent" redirects to merely be long
    lived, which helps with maintainability.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        patch_cache_control(self, public=True, max_age=settings.PERMANENT_REDIRECT_CACHE_TIME)


class NormandyCommonMiddleware(CommonMiddleware):
    """
    Overrides CommonMiddleware to customize it to Normandy's needs.

    Includes cache control headers on APPEND_SLASH redirects.
    """

    response_redirect_class = HttpResponsePermanentRedirectCached


class NormandySecurityMiddleware(SecurityMiddleware):
    """Logs HTTP to HTTPS redirects, and adds cache headers to them."""

    def process_request(self, request):
        response = super().process_request(request)
        if response is not None:
            assert type(response) is http.HttpResponsePermanentRedirect
            patch_cache_control(response, public=True, max_age=settings.HTTPS_REDIRECT_CACHE_TIME)

            # Pull out just the HTTP headers from the rest of the request meta
            headers = {
                key.lstrip('HTTP_'): value
                for (key, value) in request.META.items()
                if key.startswith('HTTP_') or key == 'CONTENT_TYPE' or key == 'CONTENT_LENGTH'
            }

            logger.debug(
                f'Served HTTP to HTTPS redirect for {request.path}',
                extra={
                    'code': DEBUG_HTTP_TO_HTTPS_REDIRECT,
                    'method': request.method,
                    'body': request.body.decode('utf-8'),
                    'path': request.path,
                    'headers': headers,
                }
            )
        return response


class OIDCEndpointRequestError(Exception):
    """Happens when the server-to-server communication with the OIDC endpoint
    succeeds but the OIDC endpoints responds with a status code > 200 and less
    than 500."""


class OIDCAccessTokenAuthorizationMiddleware:
    """Middleware that looks for 'Authorization: Bearer access_token' headers in
    the request and uses this access token to use an OIDC provider to turn that into
    a user profile. If that works, the request becomes signed in as this user.

    Note, it only signs in the user's request. Not session. Since this is not
    an authentication backend, there is no 'Set-Cookie' header returned in the
    response.

    The flow is as follows:

    1. (outside Normandy) Client trades email/username and password with the
       OIDC provider for an access token.
    2. The access token is sent to us here.
    3. We send it to the OIDC provider in return for a user profile.
    4. We extract the email from the user profile (and first- and last name)
    5. Turn the email into a Django User model instance.
    6. If possible, extracts the first- and last name and updates the User instance persistently.
    7. Sets that user as the user of the request thus enabling `request.user.is_active`.

    NOTE! When the bearer token is present, it does a network request to the OIDC provider
    every single time. There is no caching. Even for identical access tokens used
    frequently. The justification for this at the Normandy Admin UI requests are
    not high-traffic to performance critical. Also, we don't have a cache framework
    set up.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.UserModel = get_user_model()

    def __call__(self, request):
        response = self.process_request(request)
        if not response:
            response = self.get_response(request)
        return response

    def process_request(self, request):
        header_value = request.META.get('HTTP_AUTHORIZATION')
        if not header_value:
            # That's cool. If it's not there, it's not there.
            # This middleware will not be able to sign in the user
            # for the duration of this request.
            return
        matched = re.match(
            # Note thet re.match requires it to match from the beginning
            # otherwise it might match `Something Bearer deadbeef`
            r'Bearer\s+(.*)',
            header_value,
            re.I
        )
        if not matched:
            # The header was there but it didn't have a conformant "Bearer token value".
            raise PermissionDenied('Invalid Authorization header value')

        access_token = matched.group(1)

        user_profile = self._fetch_oidc_user_profile(access_token)
        email = user_profile.get('email')
        if not email:
            # This would happen if someone has requested an access token
            # from their OIDC provider *without the 'email' scope*.
            # For example, if you do:
            #
            # new auth0.WebAuth({
            #   domain: OIDC_DOMAIN,
            #   clientID: OIDC_CLIENT_ID,
            #   responseType: 'token id_token',
            #   scope: 'openid profile',       <-- note lack of 'email'
            # });
            #
            # Ideally the client should review their config. The
            # access token did work but not sufficient for our needs.
            raise PermissionDenied("User profile lacks 'email' scope.")

        # Minimal normalization. Also forces all emails to be lower case
        # which makes the UserModel lookup by email faster.
        email = email.strip().lower()

        # Awesome! Turn this email into a Django User instance.
        try:
            user = self.UserModel.objects.get(email=email)
        except self.UserModel.DoesNotExist:
            user = self.UserModel.objects.create(
                username=email[:150],
                email=email,
            )

        # Take this opportunity to suck bits from the user profile to
        # enrich our current Django user.
        if (
            'family_name' in user_profile and 'given_name' in user_profile and
            (
                user_profile['family_name'] != user.last_name or
                user_profile['given_name'] != user.first_name
            )
        ):
            user.first_name = user_profile['given_name'].strip()
            user.last_name = user_profile['family_name'].strip()
            user.save()

        # Now, let's "become" this user for the rest of the request.
        request.user = user
        user_logged_in.send(sender=user.__class__, request=request, user=user)

    @backoff.on_exception(
        backoff.constant,
        requests.exceptions.RequestException,
        max_tries=5,
    )
    def _fetch_oidc_user_profile(self, access_token):
        url = settings.OIDC_USER_ENDPOINT
        response = requests.get(url, headers={
            'Authorization': 'Bearer {0}'.format(access_token)
        })
        if response.status_code == 200:
            return response.json()
        if response.status_code == 401:
            # The OIDC provider did not like the access token.
            raise PermissionDenied('Unauthorized access token')
        if response.status_code >= 500:
            raise requests.exceptions.RequestException(f'{response.status_code} on {url}')

        # This could happen if, for some reason, we're not configured to be
        # allowed to talk to the OIDC endpoint.
        raise OIDCEndpointRequestError(response.status_code)
