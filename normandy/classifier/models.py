import uuid

from django.utils.functional import cached_property

from normandy.classifier.geolocation import get_country_code


class Client(object):
    """A client attempting to fetch a set of recipes."""
    def __init__(self, request, locale=None):
        self.request = request
        self.locale = locale

    @cached_property
    def country(self):
        ip_address = self.request.META.get('REMOTE_ADDR')
        return get_country_code(ip_address)

    @property
    def request_time(self):
        return self.request.received_at

    @property
    def user_id(self):
        """
        A UUID unique to a user, sent to us from Firefox.

        If the user did not provide an ID, this returns a random UUID.
        """
        # TODO: Eventually this will be something from the request.
        return str(uuid.uuid4())
