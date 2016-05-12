import json
import os

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from webpack_loader.utils import get_loader

from normandy.recipes.models import Action


class Command(BaseCommand):
    help = 'Updates the actions in the database with the latest built code.'

    @transaction.atomic
    def handle(self, *args, **options):
        chunks = get_loader('ACTIONS').get_assets()['chunks']
        for name, action_directory in settings.ACTIONS.items():
            self.stdout.write('Updating action {}...'.format(name), ending='')

            # We assume each action is compiled to a single chunk.
            implementation_path = chunks[name][0]['path']
            with open(implementation_path) as f:
                implementation = f.read()

            with open(os.path.join(action_directory, 'package.json')) as f:
                action_metadata = json.load(f)

            # Create new action or update the existing one.
            action, created = Action.objects.update_or_create(name=name, defaults={
                'implementation': implementation,
                'arguments_schema': action_metadata['normandy']['argumentsSchema'],
            })

            self.stdout.write('Done')
