from django.utils import timezone


class RequestReceivedAtMiddleware(object):
    """
    Adds a 'received_at' property to requests with a datetime showing
    when the request was received by Django.
    """
    def process_request(self, request):
        request.received_at = timezone.now()
