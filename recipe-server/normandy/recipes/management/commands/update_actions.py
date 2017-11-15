import json
import os

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from webpack_loader.utils import get_loader

from normandy.recipes.models import Action


class Command(BaseCommand):
    help = 'Updates the actions in the database with the latest built code.'

    def add_arguments(self, parser):
        parser.add_argument(
            'action_name',
            nargs='*',
            type=str,
            help='Only update the specified actions'
        )

    @transaction.atomic
    def handle(self, *args, **options):
        action_names = settings.ACTIONS.keys()
        if options['action_name']:
            action_names = [name for name in action_names if name in options['action_name']]

        for name in action_names:
            self.stdout.write('Updating action {}...'.format(name), ending='')
            implementation = get_implementation(name)
            arguments_schema = get_arguments_schema(name)

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

            except Action.DoesNotExist:
                action = Action(
                    name=name,
                    implementation=implementation,
                    arguments_schema=arguments_schema
                )
                action.save()

            self.stdout.write('Done')


def get_implementation(action_name):
    chunks = get_loader('ACTIONS').get_assets()['chunks']
    implementation_path = chunks[action_name][0]['path']
    with open(implementation_path) as f:
        return f.read()


def get_arguments_schema(action_name):
    action_directory = settings.ACTIONS[action_name]
    with open(os.path.join(action_directory, 'package.json')) as f:
        action_metadata = json.load(f)
        return action_metadata['normandy']['argumentsSchema']
