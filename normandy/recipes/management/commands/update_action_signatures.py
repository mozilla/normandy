from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db.models import Q
from django.utils import timezone

from normandy.recipes.models import Action


class Command(BaseCommand):
    """Update signatures for Actions that have no signature or an old signature."""
    help = 'Update Action signatures'
    requires_system_checks = False

    def add_arguments(self, parser):
        parser.add_argument(
            '-f', '--force',
            action='store_true',
            help='Update signatures for all actions'
        )

    def handle(self, *args, force=False, **options):
        if force:
            actions_to_update = Action.objects.all()
        else:
            actions_to_update = self.get_outdated_actions()

        count = actions_to_update.count()
        if count == 0:
            self.stdout.write('No out of date actions to sign')
        else:
            self.stdout.write(f'Signing {count} actions:')
            for action in actions_to_update:
                self.stdout.write(' * ' + action.name)
                action.update_signature()
                action.save()

    def get_outdated_actions(self):
        outdated_age = timedelta(seconds=settings.AUTOGRAPH_SIGNATURE_MAX_AGE)
        outdated_filter = Q(signature__timestamp__lt=timezone.now() - outdated_age)
        missing_filter = Q(signature=None)
        return Action.objects.filter(outdated_filter | missing_filter)
