from django.apps import AppConfig

from normandy.recipes import checks


class RecipesApp(AppConfig):
    name = 'normandy.recipes'
    label = 'recipes'
    verbose_name = 'Normandy Recipes'

    def ready(self):
        checks.register()
