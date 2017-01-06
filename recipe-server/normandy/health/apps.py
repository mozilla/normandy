from django.apps import AppConfig

from normandy.health import checks


class HealthApp(AppConfig):
    name = 'normandy.health'
    label = 'health'
    verbose_name = 'Normandy Health'

    def ready(self):
        checks.register()
