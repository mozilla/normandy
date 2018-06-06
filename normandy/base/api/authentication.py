from django.conf import settings
from django.contrib.auth import get_user_model

import backoff
import requests

from rest_framework import exceptions
from rest_framework.authentication import BaseAuthentication, get_authorization_header


class OIDCEndpointRequestError(Exception):
    """Happens when the server-to-server communication with the OIDC endpoint succeeds but the
    OIDC endpoints responds with a status code less than 500 and not equal to 200 or 401."""


class BearerTokenAuthentication(BaseAuthentication):
    """
    Bearer token based authentication.

    Clients should authenticate by passing the token key in the "Authorization" HTTP header,
    prepended with the string "Bearer ".  For example:

        Authorization: Bearer 401f7ac837da42b97f613d789819ff93537bee6a

    NOTE: When the bearer token is present, it does a network request to the OIDC provider every
    single time. There is no caching. Even for identical access tokens used frequently. The
    justification for this at the Normandy Admin UI requests are not high-traffic to performance
    critical.
    """

    keyword = 'Bearer'

    def authenticate(self, request):
        auth_header = get_authorization_header(request).decode().split()

        if not auth_header or auth_header[0].lower() != self.keyword.lower():
            return None

        access_token = auth_header[1]

        user_profile = self.fetch_oidc_user_profile(access_token)

        email = user_profile.get('email', '').strip().lower()
        if not email:
            # This would happen if someone has requested an access token
            # from their OIDC provider *without the 'email' scope*.
            raise exceptions.AuthenticationFailed("User profile lacks 'email' scope.")

        # Turn this email into a Django User instance.
        # TODO: Users created here do not have requisite permissions. Should we scrap this?
        user, _ = get_user_model().objects.get_or_create(
            email=email, defaults={'username': email[:150]})

        # Sync user data with OIDC profile
        family_name = user_profile.get('family_name', '').strip()
        given_name = user_profile.get('given_name', '').strip()
        if family_name or given_name:
            if family_name != user.last_name:
                user.last_name = family_name
            if given_name != user.first_name:
                user.first_name = given_name
            user.save()

        return (user, access_token)

    @backoff.on_exception(
        backoff.constant,
        requests.exceptions.RequestException,
        max_tries=5,
    )
    def fetch_oidc_user_profile(self, access_token):
        url = settings.OIDC_USER_ENDPOINT
        response = requests.get(url, headers={
            'Authorization': f'Bearer {access_token}'
        })

        if response.status_code == 200:
            return response.json()
        elif response.status_code == 401:
            # The OIDC provider did not like the access token.
            raise exceptions.AuthenticationFailed('Unauthorized access token')
        elif response.status_code >= 500:
            raise requests.exceptions.RequestException(f'{response.status_code} on {url}')

        # This could happen if, for some reason, we're not configured to be
        # allowed to talk to the OIDC endpoint.
        raise OIDCEndpointRequestError(response.status_code)

    def authenticate_header(self, request):
        return self.keyword
