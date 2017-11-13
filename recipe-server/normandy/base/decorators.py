from django.conf import settings
from django.views.decorators.cache import cache_control


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
