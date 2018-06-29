from django.apps import AppConfig

from normandy.base import checks


class BaseApp(AppConfig):
    name = "normandy.base"
    label = "base"
    verbose_name = "Normandy"

    def ready(self):
        checks.register()
