import json
import os

from django.conf import settings
from django.contrib.staticfiles.finders import FileSystemFinder
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from normandy.recipes.models import Action


class Command(BaseCommand):
    help = "Updates the actions in the database with the latest built code."

    def add_arguments(self, parser):
        parser.add_argument(
            "action_name", nargs="*", type=str, help="Only update the specified actions"
        )

    @transaction.atomic
    def handle(self, *args, **options):
        # Generate a list of all action names first. This is so it becomes
        # possible to filter on them by name.
        action_names = {}
        # First get the list of "legacy" actions by listing all directory
        for name in os.listdir(settings.ACTIONS_ROOT_DIRECTORY):
            if name == "tests":
                continue
            directory = os.path.join(settings.ACTIONS_ROOT_DIRECTORY, name)
            if os.path.isdir(directory):
                action_names[name] = directory

        # Next get all the keys from the @mozilla/normandy-action-argument-schemas package.
        action_schemas_fp = os.path.join(settings.ACTIONS_SCHEMA_DIRECTORY, "schemas.json")
        with open(action_schemas_fp) as f:
            action_schemas = json.load(f)

        aliases = settings.ACTIONS_ALIAS_NAMES
        for name in action_schemas:
            # If the name in @mozilla/normandy-action-argument-schemas
            # schemas.json isn't desired, here's our chance to call it our
            # own name.
            name = aliases.get(name, name)
            # Setting it to None will mean it has no implementation
            action_names[name] = None

        if options["action_name"]:
            action_names = {
                name: value
                for name, value in action_names.items()
                if name in options["action_name"]
            }
            # If you did specify a name filter and nothing matched, throw.
            if not action_names:
                raise CommandError(f"No actions matching {options['action_name']}")

        for name, implementation_directory in action_names.items():
            self.stdout.write("Updating action {}...".format(name), ending="")
            if implementation_directory:
                # Old-style actions have an implementation on disk
                # and their schemas
                implementation = get_implementation(name)
                arguments_schema = get_arguments_schema_by_implementation(
                    name, implementation_directory
                )
            else:
                implementation = None
                arguments_schema = get_arguments_schema_by_schemas(name, action_schemas, aliases)

            # Create a new action or update the existing one.
            try:
                action = Action.objects.get(name=name)
                should_update = (
                    action.implementation != implementation
                    or action.arguments_schema != arguments_schema
                )
                if should_update:
                    # Watch out! If the change is that it used to have an
                    # implementation and now it doesn't, then alert the user
                    # about this.
                    if (
                        not implementation
                        and action.implementation
                        and action.arguments_schema != arguments_schema
                    ):
                        # I.e. it *had* an implementation, but now the schema
                        # comes (and is different!) from the
                        # @mozilla/normandy-action-argument-schemas package.
                        self.stdout.write(
                            self.style.WARNING(
                                f"Action {name} is changing implementation AND argument schema. "
                                "You might want to manually check that the new argument schema "
                                "is compatible with the old implementation."
                            )
                        )

                    action.arguments_schema = arguments_schema
                    if implementation:
                        # This means we're potentially "merging" actions.
                        # The old implementation and the new arguments schema.
                        action.implementation = implementation
                    action.save()

            except Action.DoesNotExist:
                action = Action(
                    name=name, implementation=implementation, arguments_schema=arguments_schema
                )
                action.save()

            self.stdout.write("Done")


def get_implementation(action_name):
    implementation_path = FileSystemFinder().find(f"bundles/{action_name}.js")
    with open(implementation_path) as f:
        return f.read()


def get_arguments_schema_by_implementation(action_name, implementation_directory):
    with open(os.path.join(implementation_directory, "package.json")) as f:
        action_metadata = json.load(f)
        return action_metadata["normandy"]["argumentsSchema"]


def get_arguments_schema_by_schemas(action_name, schemas, aliases):
    if action_name in schemas:
        return schemas[action_name]
    # Reverse the name alias in case it's called something else in the
    # schemas.json file.
    aliases_inverted = {v: k for k, v in aliases.items()}
    action_name = aliases_inverted.get(action_name, action_name)
    return schemas[action_name]
