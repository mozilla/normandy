from urllib.parse import urlparse, urlunparse
from django.core.management.base import BaseCommand
from django.template.defaultfilters import pluralize

from normandy.recipes.models import RecipeRevision


class Command(BaseCommand):
    """
    Rewrite all revisions to update the URL of add-ons stored in Normandy's
    file storage to a new hostname.
    """

    help = "Updates add-on URL in revisions"

    def add_arguments(self, parser):
        parser.add_argument("new_hostname", help="Hostname to convert add-on urls to")

    def handle(self, *args, new_hostname, **options):
        target_revisions = RecipeRevision.objects.filter(action__name="opt-out-study")
        update_count = 0
        for rev in target_revisions.iterator():
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

            parsed_url = urlparse(arguments["addonUrl"])
            if parsed_url.netloc == new_hostname:
                # nothing to do
                continue

            # _replace is not a private method. parsed_url is a named tuple,
            # and named tuples expose all their public methods with underscores
            # to avoid colliding with data keys.
            new_url_parts = parsed_url._replace(netloc=new_hostname)
            new_url = urlunparse(new_url_parts)
            arguments["addonUrl"] = new_url
            rev.arguments = arguments
            rev.save()
            update_count += 1

        self.stdout.write(f"{update_count} revision{pluralize(update_count)} updated")
