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

    def add_arguments(self, parser):
        parser.add_argument(
            '-f', '--force',
            action='store_true',
            help='Update signatures for all recipes'
        )

    def handle(self, *args, force=False, **options):
        if force:
            recipes_to_update = Recipe.objects.filter(enabled=True)
        else:
            recipes_to_update = self.get_outdated_recipes()

        count = recipes_to_update.count()
        if count == 0:
            self.stdout.write('No out of date recipes to sign')
        else:
            self.stdout.write('Signing {} recipes:'.format(count))
            for recipe in recipes_to_update:
                self.stdout.write(' * ' + recipe.name)
            recipes_to_update.update_signatures()

        recipes_to_unsign = Recipe.objects.filter(enabled=False).exclude(signature=None)
        count = recipes_to_unsign.count()
        if count == 0:
            self.stdout.write('No disabled recipes to unsign')
        else:
            self.stdout.write('Unsigning {} disabled recipes:'.format(count))
            for recipe in recipes_to_unsign:
                self.stdout.write(' * ' + recipe.name)
                sig = recipe.signature
                recipe.signature = None
                recipe.save()
                sig.delete()

    def get_outdated_recipes(self):
        outdated_age = timedelta(seconds=settings.AUTOGRAPH_SIGNATURE_MAX_AGE)
        outdated_filter = Q(signature__timestamp__lt=timezone.now() - outdated_age)
        missing_filter = Q(signature=None)
        return Recipe.objects.filter(enabled=True).filter(outdated_filter | missing_filter)
