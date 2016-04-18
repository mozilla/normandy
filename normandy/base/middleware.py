from django.core.urlresolvers import Resolver404, resolve
from django.utils import timezone


class ShortCircuitMiddleware(object):
    """
    Middleware that skips remaining middleware when a view is marked with
    normandy.base.decorators.short_circuit_middlewares
    """

    def process_request(self, request):
        try:
            result = resolve(request.path)
        except Resolver404:
            return

        if getattr(result.func, 'short_circuit_middlewares', False):
            return result.func(request, *result.args, **result.kwargs)
        else:
            return None


class RequestReceivedAtMiddleware(object):
    """
    Adds a 'received_at' property to requests with a datetime showing
    when the request was received by Django.
    """
    def process_request(self, request):
        request.received_at = timezone.now()
