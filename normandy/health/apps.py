from django.apps import AppConfig


class HealthApp(AppConfig):
    name = "normandy.health"
    label = "health"
    verbose_name = "Normandy Health"

    def ready(self):
        # Import for side-effect: registers signal handler
        import normandy.health.signals  # NOQA
