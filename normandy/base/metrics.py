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
        super().__init__(options)
        if not settings.DEBUG:
            raise ImproperlyConfigured(
                f"The {self.__class__.__name} can only be used if DEBUG=True"
            )

    def emit(self, record):
        # round floats to 2 decimal points
        value = record.value
        if record.stat_type == "timing":
            value = f"{value:.1f}ms"

        elif isinstance(value, float):
            if int(value) != value:
                value = round(value * 100.0) / 100.0

        op = "="
        if record.stat_type == "incr":
            op = "+="

        result = f"[{record.stat_type}] {record.key} {op} {record.value}"
        if record.tags:
            tags_display = ", ".join(t for t in record.tags)
            result += f" tags=[{tags_display}]"
        logger.debug(result)
