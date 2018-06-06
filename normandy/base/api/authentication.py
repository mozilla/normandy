import re

from django.conf import settings
from django.contrib.auth import get_user_model

import backoff
import requests

from rest_framework import exceptions
from rest_framework.authentication import BaseAuthentication, get_authorization_header


class OIDCEndpointRequestError(Exception):
    """Happens when the server-to-server communication with the OIDC endpoint
    succeeds but the OIDC endpoints responds with a status code > 200 and less
    than 500."""


class BearerTokenAuthentication(BaseAuthentication):
    """This looks for 'Authorization: Bearer access_token' headers in
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
    not high-traffic to performance critical.
    """
    keyword = 'Bearer'

    def authenticate(self, request):
        auth_header = get_authorization_header(request).decode()

        if not auth_header or auth_header.split()[0].lower() != self.keyword.lower():
            return None

        matched = re.match(r'{}\s+(.*)'.format(self.keyword), auth_header, re.I)
        if not matched:
            # The header was there but it didn't have a conformant "Bearer token value".
            raise exceptions.AuthenticationFailed('Invalid Authorization header value')

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
            raise exceptions.AuthenticationFailed("User profile lacks 'email' scope.")

        # Minimal normalization. Also forces all emails to be lower case
        # which makes the UserModel lookup by email faster.
        email = email.strip().lower()

        # Awesome! Turn this email into a Django User instance.
        # TODO: Users created here do not have requisite permissions. Should we scrap this?
        User = get_user_model()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            user = User.objects.create(
                username=email[:150],
                email=email,
            )

        # Take this opportunity to suck bits from the user profile to
        # enrich our current Django user.
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
    def _fetch_oidc_user_profile(self, access_token):
        url = settings.OIDC_USER_ENDPOINT
        response = requests.get(url, headers={
            'Authorization': f'Bearer {access_token}'
        })
        if response.status_code == 200:
            return response.json()
        if response.status_code == 401:
            # The OIDC provider did not like the access token.
            raise exceptions.AuthenticationFailed('Unauthorized access token')
        if response.status_code >= 500:
            raise requests.exceptions.RequestException(f'{response.status_code} on {url}')

        # This could happen if, for some reason, we're not configured to be
        # allowed to talk to the OIDC endpoint.
        raise OIDCEndpointRequestError(response.status_code)

    def authenticate_header(self, request):
        return self.keyword
