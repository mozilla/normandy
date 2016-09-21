from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db.models import Q
from django.utils import timezone

from normandy.recipes.models import Recipe


class Command(BaseCommand):
    """
    Update signatures for enabled Recipes that have no signature or an old signature
    """
    help = 'Update Recipe signatures'

    def handle(self, *args, **options):
        outdated_age = timedelta(seconds=settings.AUTOGRAPH_SIGNATURE_MAX_AGE)
        outdated_filter = Q(signature__timestamp__lt=timezone.now() - outdated_age)
        missing_filter = Q(signature=None)
        recipes_to_update = (Recipe.objects
                             .filter(enabled=True)
                             .filter(outdated_filter | missing_filter))

        count = recipes_to_update.count()

        if count == 0:
            self.stdout.write('No out of date recipes')
            return

        self.stdout.write('Updating signatures for {} recipes:'.format(count))
        for action in recipes_to_update:
            self.stdout.write(' * ' + action.name)
        recipes_to_update.update_signatures()
        self.stdout.write(' Done')
