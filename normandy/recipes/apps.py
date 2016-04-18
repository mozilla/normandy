from django.apps import AppConfig

from normandy.recipes import checks
from normandy.recipes.geolocation import load_geoip_database


class RecipesApp(AppConfig):
    name = 'normandy.recipes'
    label = 'recipes'
    verbose_name = 'Normandy Recipes'

    def ready(self):
        checks.register()
        load_geoip_database()
