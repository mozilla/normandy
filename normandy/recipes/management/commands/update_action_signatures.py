from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db.models import Q
from django.utils import timezone

from normandy.recipes.models import Action


class Command(BaseCommand):
    """
    Update signatures for Actions that have no signature or an old signature.
    """
    help = 'Update Action signatures'

    def handle(self, *args, **options):
        outdated_age = timedelta(seconds=settings.ACTION_SIGNATURE_MAX_AGE)
        outdated_filter = Q(signature_timestamp__lt=timezone.now() - outdated_age)
        missing_filter = Q(signature=None)
        outdated_actions = Action.objects.filter(outdated_filter | missing_filter)

        count = outdated_actions.count()

        if count == 0:
            self.stdout.write('No out of date actions')
            return

        self.stdout.write('Updating signatures for {} actions:'.format(count))
        for action in outdated_actions:
            self.stdout.write(' * ' + action.name)
        outdated_actions.update_signatures()
        self.stdout.write(' Done')
