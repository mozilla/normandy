from normandy.recipes.models import Action, Recipe
from normandy.recipes.tests import ClientFactory, RecipeFactory


def console_log(message, **kwargs):
    return RecipeFactory(
        action=Action.objects.get(name='console-log'),
        arguments={'message': message},
        **kwargs
    )


def get_fixtures():
    """Return all defined fixtures."""
    return sorted(
        [FixtureClass() for FixtureClass in Fixture.__subclasses__()],
        key=lambda f: f.name
    )


class Fixture(object):
    """
    Collection of data for a specific manual test case. Includes both
    data to be loaded in the database, and data needed to represent
    API responses that don't use the database.
    """
    @property
    def name(self):
        return self.__class__.__name__

    @property
    def description(self):
        return '<p class="description">{}</p>'.format(self.__doc__)

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
    """Matches all clients. Logs a message to the console."""
    def load_data(self):
        console_log('ConsoleLogBasic executed', filter_expression='true')
            filter_expression='true',
        )
