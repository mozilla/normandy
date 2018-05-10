from normandy.base.decorators import api_cache_control


class CachingViewsetMixin(object):
    """Modify a ModelViewSet to add caching to read methods"""

    @api_cache_control()
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @api_cache_control()
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
