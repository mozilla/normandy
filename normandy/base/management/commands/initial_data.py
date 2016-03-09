from django.core.management.base import BaseCommand

from normandy.recipes.models import ReleaseChannel


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
