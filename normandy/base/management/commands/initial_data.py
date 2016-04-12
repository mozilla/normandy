import json
import os

from django.core.management.base import BaseCommand

from normandy.recipes.models import Action, ReleaseChannel


class Command(BaseCommand):
    """
    Adds some helpful initial data to the site's database. If matching
    data already exists, it should _not_ be overwritten, making this
    safe to run multiple times.

    This exists instead of data migrations so that test runs do not load
    this data into the test database.

    If this file grows too big, we should consider finding a library or
    coming up with a more robust way of adding this data.
    """
    help = 'Adds initial data to database'

    def handle(self, *args, **options):
        self.add_release_channels()
        self.add_default_action()

    def add_release_channels(self):
        self.stdout.write('Adding Release Channels...', ending='')
        channels = {
            'release': 'Release',
            'beta': 'Beta',
            'aurora': 'Developer Edition',
            'nightly': 'Nightly'
        }

        for slug, name in channels.items():
            ReleaseChannel.objects.get_or_create(slug=slug, defaults={'name': name})
        self.stdout.write('Done')

    def add_default_action(self):
        self.stdout.write('Adding default Actions...', ending='')

        with open(os.path.join(os.path.dirname(__file__), 'data', 'console-log.js')) as f:
            action_impl = f.read()
        arguments_schema = {
            "$schema": "http://json-schema.org/draft-04/schema#",
            "title": "Log a message to the console",
            "type": "object",
            "required": [
                "message"
            ],
            "properties": {
                "message": {
                    "description": "Message to log to the console",
                    "type": "string",
                    "default": ""
                }
            }
        }

        Action.objects.get_or_create(name='console-log', defaults={
            'implementation': action_impl,
            'arguments_schema_json': json.dumps(arguments_schema),
        })

        self.stdout.write('Done')
