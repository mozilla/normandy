from django.conf import settings
from django.views.decorators.cache import cache_control


class CachingMixin:
    """Modify a ModelViewSet to add caching to read methods"""

    @cache_control(public=True, max_age=settings.API_CACHE_TIME)
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @cache_control(public=True, max_age=settings.API_CACHE_TIME)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
