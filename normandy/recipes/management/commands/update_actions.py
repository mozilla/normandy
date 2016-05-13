import json
import os

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from reversion import revisions as reversion
from webpack_loader.utils import get_loader

from normandy.recipes.models import Action, Recipe


class Command(BaseCommand):
    help = 'Updates the actions in the database with the latest built code.'

    @transaction.atomic
    @reversion.create_revision()
    def handle(self, *args, **options):
        disabled_recipes = []
        chunks = get_loader('ACTIONS').get_assets()['chunks']

        for name, action_directory in settings.ACTIONS.items():
            self.stdout.write('Updating action {}...'.format(name), ending='')

            # We assume each action is compiled to a single chunk.
            implementation_path = chunks[name][0]['path']
            with open(implementation_path) as f:
                implementation = f.read()

            with open(os.path.join(action_directory, 'package.json')) as f:
                action_metadata = json.load(f)
                arguments_schema = action_metadata['normandy']['argumentsSchema']

            # Create a new action or update the existing one.
            try:
                action = Action.objects.get(name=name)
                should_update = (
                    action.implementation != implementation
                    or action.arguments_schema != arguments_schema
                )

                if should_update:
                    action.implementation = implementation
                    action.arguments_schema = arguments_schema
                    action.save()

                    # As a precaution, disable any recipes that are
                    # being used by an action that was just updated.
                    recipes = Recipe.objects.filter(action=action, enabled=True)
                    disabled_recipes += list(recipes)
                    recipes.update(enabled=False)
            except Action.DoesNotExist:
                action = Action(
                    name=name,
                    implementation=implementation,
                    arguments_schema=arguments_schema
                )
                action.save()

            self.stdout.write('Done')

        if disabled_recipes:
            self.stdout.write('\nThe following recipes were disabled while updating actions:')
            for recipe in disabled_recipes:
                self.stdout.write(recipe.name)
