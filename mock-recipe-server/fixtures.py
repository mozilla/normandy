from normandy.recipes.models import Action, Recipe
from normandy.recipes.tests import ClientFactory, RecipeFactory


def console_log_action():
    return Action.objects.get(name='console-log')


def get_fixtures():
    """Return all defined fixtures."""
    return [FixtureClass() for FixtureClass in Fixture.__subclasses__()]


class Fixture(object):
    """
    Collection of data for a specific manual test case. Includes both
    data to be loaded in the database, and data needed to represent
    API responses that don't use the database.
    """
    @property
    def name(self):
        return self.__class__.__name__

    def load(self):
        """
        Clear out all existing recipes and load this fixture's data in
        its place.
        """
        Recipe.objects.all().delete()
        self.load_data()

    def load_data(self):
        """
        Create data specific to this fixture. Individual fixtures must
        override this.
        """
        raise NotImplementedError()

    def client(self):
        """
        Return a Client object that the client classification endpoint
        should render for this fixture.
        """
        return ClientFactory()


class ConsoleLogBasic(Fixture):
    """A single console-log action."""
    def load_data(self):
        RecipeFactory(
            action=console_log_action(),
            arguments={'message': 'Test Message'},
            filter_expression='true',
        )
