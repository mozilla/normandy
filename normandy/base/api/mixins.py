from django.conf import settings
from django.views.decorators.cache import cache_control

from normandy.base.api.exceptions import MidairCollisionError
from normandy.base.api.serializers import LastUpdatedSerializer


class CachingViewsetMixin(object):
    """Modify a ModelViewSet to add caching to read methods"""

    @cache_control(public=True, max_age=settings.API_CACHE_TIME)
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @cache_control(public=True, max_age=settings.API_CACHE_TIME)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


_midair_collision_enabled = True


def _set_midair_collision(enabled=True):
    global _midair_collision_enabled
    _midair_collision_enabled = enabled


class MidairCollisionViewsetMixin(object):
    """Modify a ModelViewSet to add midair collision to update methods"""

    def update(self, request, *args, **kwargs):
        if _midair_collision_enabled:
            # Using a serializer gets some easy validation
            serializer = LastUpdatedSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            request_ts = serializer.validated_data['last_updated']
            instance_ts = self.get_object().last_updated

            # Round to one-second precision, because JSON serialization often
            # truncates sub-second times.
            request_ts = request_ts.replace(microsecond=0)
            instance_ts = instance_ts.replace(microsecond=0)

            if request_ts != instance_ts:
                raise MidairCollisionError()

        return super().update(request, *args, **kwargs)
