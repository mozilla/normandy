from django.core.management.base import BaseCommand
from django.template.defaultfilters import pluralize

from normandy.recipes.models import RecipeRevision
from normandy.studies.models import Extension


def get_filename_from_url(url):
    url.split("/")[-1]


class Command(BaseCommand):
    """
    Rewrite all revisions to update the URL of add-ons stored in Normandy's
    file storage to a new hostname.
    """

    help = "Updates add-on URL in revisions to match the current storage system"

    def handle(self, *args, **options):
        extension_by_filename = {}
        for extension in Extension.objects.all():
            filename = get_filename_from_url(extension.xpi.url)
            extension_by_filename[filename] = extension

        target_revisions = RecipeRevision.objects.filter(action__name="opt-out-study")
        update_count = 0
        for rev in target_revisions:
            # Pull into a local variable to modify the arguments since
            # `rev.arguments` is actually a property that parses JSON, not a
            # real attribute of the object
            arguments = rev.arguments

            if not arguments.get("addonUrl"):
                self.stderr.write(
                    f"Warning: Recipe {rev.recipe.id} revision {rev.id} has action=opt-out-study, "
                    f"but no addonUrl",
                    ending="\n",
                )
                continue

            filename = get_filename_from_url(arguments["addonUrl"])

            if filename not in extension_by_filename:
                self.stderr.write(
                    f"Warning: Recipe {rev.recipe.id} revision {rev.id} has an addonUrl that does "
                    f"not match any in the database.",
                    ending="\n",
                )
                continue

            extension = extension_by_filename[filename]
            new_url = extension.xpi.url
            if arguments["addonUrl"] == new_url:
                # nothing to do
                continue

            arguments["addonUrl"] = extension.xpi.url
            rev.arguments = arguments
            rev.save()
            update_count += 1

        self.stdout.write(f"{update_count} revision{pluralize(update_count)} updated")
