from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    """
    Meta command to call all update_*_signatures management commands.
    """
    help = 'Update all signatures'
    requires_system_checks = False

    def add_arguments(self, parser):
        parser.add_argument(
            '-f', '--force',
            action='store_true',
            help='Update all signatures'
        )

    def handle(self, *args, force=False, **options):
        if force:
            call_command('update_recipe_signatures', '--force')
            call_command('update_action_signatures', '--force')
        else:
            call_command('update_recipe_signatures')
            call_command('update_action_signatures')
