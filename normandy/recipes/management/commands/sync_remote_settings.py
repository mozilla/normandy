import sys

from django.core.management.base import BaseCommand

from normandy.recipes.models import Recipe
from normandy.recipes.exports import RemoteSettings, recipe_as_record


KINTO_INTERNAL_FIELDS = ("last_modified", "schema")


def compare_remote(recipe, record):
    as_record = recipe_as_record(recipe)
    cleaned_record = {k: v for k, v in record.items() if k not in KINTO_INTERNAL_FIELDS}
    return as_record == cleaned_record


class Command(BaseCommand):
    """Check that Remote Settings published content is consistent and up-to-date.
    """

    help = "Sync recipes with Remote Settings"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run", action="store_true", default=False, help="Do not sync, just print out."
        )

    def handle(self, *args, dry_run=False, **options):
        remote_settings = RemoteSettings()

        local_recipes = Recipe.objects.filter(approved_revision__enabled_state__enabled=True)
        remote_records = remote_settings.published_recipes()

        # Compare the two sets: local recipes that are missing remotely will
        # be published, recipes that differ will be updated, and recipes that
        # are only on the remote server will be unpublished.
        to_publish = []
        to_update = []
        local_by_id = {str(r.id): r for r in local_recipes}
        remote_by_id = {r["id"]: r for r in remote_records}
        for rid, local_recipe in local_by_id.items():
            if rid in remote_by_id:
                remote_record = remote_by_id.pop(rid)
                if not compare_remote(local_recipe, remote_record):
                    to_update.append(local_recipe)
            else:
                to_publish.append(local_recipe)
        # Lookup locally the recipes that are published but should not.
        to_unpublish = []
        for rid in remote_by_id.keys():
            try:
                to_unpublish.append(Recipe.objects.get(id=rid))
            except Recipe.DoesNotExist:
                to_unpublish.append(Recipe(id=rid))

        # If there is nothing to do, exit.
        if not to_publish and not to_update and not to_unpublish:
            self.stdout.write(self.style.SUCCESS("Sync OK. Nothing to do."))
            return

        # Show differences on stdout, and un/publish if not dry-run.
        style = self.style.SUCCESS if not to_publish else self.style.MIGRATE_LABEL
        self.stdout.write(style(f"{len(to_publish)} recipes to publish:"))
        for r in to_publish:
            self.stdout.write(f" * {r.name!r} (id={r.id!r})")
            if not dry_run:
                remote_settings.publish(r)

        style = self.style.SUCCESS if not to_update else self.style.MIGRATE_LABEL
        self.stdout.write(style(f"{len(to_update)} recipes to update:"))
        for r in to_update:
            self.stdout.write(f" * {r.name!r} (id={r.id!r})")
            if not dry_run:
                remote_settings.publish(r)

        style = self.style.SUCCESS if not to_unpublish else self.style.MIGRATE_LABEL
        self.stdout.write(style(f"{len(to_unpublish)} recipes to unpublish:"))
        for r in to_unpublish:
            name = r.name if r.name else self.style.WARNING("Unknown locally")
            self.stdout.write(f" * {name!r} (id={r.id!r})")
            if not dry_run:
                remote_settings.unpublish(r)

        # When running with dry-run, we return non-zero if some differences exist.
        if dry_run and (to_publish or to_update or to_unpublish):
            sys.exit(1)
