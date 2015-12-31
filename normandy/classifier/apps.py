from django.apps import AppConfig

from normandy.classifier.geolocation import load_geoip_database


class ClassifierConfig(AppConfig):
    name = 'normandy.classifier'

    def ready(self):
        load_geoip_database()
