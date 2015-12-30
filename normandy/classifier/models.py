class Client(object):
    """A client attempting to fetch a set of recipes."""
    def __init__(self, request):
        self.request = request

    @property
    def locale(self):
        pass

    @property
    def country(self):
        pass

    @property
    def request_time(self):
        return self.request.received_at
