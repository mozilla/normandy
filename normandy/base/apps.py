from django.apps import AppConfig

from normandy.base import checks, metrics


class BaseApp(AppConfig):
    name = "normandy.base"
    label = "base"
    verbose_name = "Normandy"

    def ready(self):
        checks.register()
        metrics.register()
