from django.utils.functional import cached_property

from normandy.classifier.geolocation import get_country_code


class Client(object):
    """A client attempting to fetch a set of recipes."""
    def __init__(self, request):
        self.request = request

    @property
    def locale(self):
        pass

    @cached_property
    def country(self):
        ip_address = self.request.META.get('REMOTE_ADDR')
        return get_country_code(ip_address)

    @property
    def request_time(self):
        return self.request.received_at
