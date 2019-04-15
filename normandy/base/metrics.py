import logging

import markus
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from markus.backends import BackendBase


logger = logging.getLogger(__name__)


def register():
    backends = []

    if settings.METRICS_USE_DEBUG_LOGS:
        backends.append({"class": "normandy.base.metrics.DebugLogsBackend"})

    if settings.METRICS_USE_STATSD:
        backends.append(
            {
                "class": "markus.backends.datadog.DatadogMetrics",
                "options": {
                    "statsd_host": settings.METRICS_STATSD_HOST,
                    "statsd_port": settings.METRICS_STATSD_PORT,
                    "statsd_namespace": settings.METRICS_STATSD_NAMESPACE,
                },
            }
        )

    markus.configure(backends=backends)


class DebugLogsBackend(BackendBase):
    def __init__(self, options):
        if not settings.DEBUG:
            raise ImproperlyConfigured(
                f"The {self.__class__.__name} can only be used if DEBUG=True"
            )

    def _emit(self, type, stat, value, tags, *, op="="):
        result = f"[{type}] {stat} {op} {value}"
        if tags:
            tags_display = ", ".join(t for t in tags)
            result += f" tags=[{tags_display}]"
        logger.debug(result)

    def incr(self, stat, value, tags=None):
        op = "+=" if value >= 0 else "-="
        self._emit("incr", stat, value, tags, op=op)

    def gauge(self, stat, value, tags=None):
        self._emit("gauge", stat, value, tags)

    def timing(self, stat, value, tags=None):
        self._emit("timing", stat, value, tags)

    def histogram(self, stat, value, tags=None):
        self._emit("histogram", stat, value, tags)
