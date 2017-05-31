from functools import wraps

from django.conf import settings
from django.views.decorators.cache import cache_control


def short_circuit_middlewares(view_func):
    """
    Marks a view function as wanting to short circuit middlewares.
    """
    # Based on Django's csrf_exempt

    # We could just do view_func.short_circuit_middlewares = True, but
    # decorators are nicer if they don't have side-effects, so we return
    # a new function.
    def wrapped_view(*args, **kwargs):
        return view_func(*args, **kwargs)
    wrapped_view.short_circuit_middlewares = True
    return wraps(view_func)(wrapped_view)


def api_cache_control(**kwargs):
    """
    Adds cache headers to a view using our API cache header defaults.
    """
    if settings.API_CACHE_ENABLED:
        directives = {
            'public': True,
            'max_age': settings.API_CACHE_TIME,
        }
    else:
        directives = {
            'no_cache': True,
            'no_store': True,
            'must_revalidate': True,
        }

    directives.update(kwargs)
    return cache_control(**directives)
