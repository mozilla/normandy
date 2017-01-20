from normandy.recipes.models import Action, Recipe
from normandy.recipes.tests import ClientFactory, RecipeFactory


def console_log(message, **kwargs):
    return RecipeFactory(
        action=Action.objects.get(name='console-log'),
        arguments={'message': message},
        **kwargs
    )


def get_testcases():
    """Return all defined testcases."""
    return sorted(
        [TestCaseClass() for TestCaseClass in TestCase.__subclasses__()],
        key=lambda f: f.name
    )


class TestCase(object):
    """
    Configuration for a specific manual test case. Subclasses can
    override methods on this class to customize the state of the server
    that will be serialized, or, if necessary, the serialization itself.
    """
    @property
    def name(self):
        return self.__class__.__name__

    @property
    def description(self):
        return '<p class="description">{}</p>'.format(self.__doc__)

    def load(self):
        """
        Clear out all existing recipes and load this test's data in
        its place.
        """
        Recipe.objects.all().delete()
        self.load_data()

    def load_data(self):
        """
        Create data specific to this test. Override to populate the
        database with recipes and other data the test case needs.
        """
        pass

    def client(self):
        """
        Return a Client object that the client classification endpoint
        should render for this test.
        """
        return ClientFactory()


class ConsoleLogBasic(TestCase):
    """Matches all clients. Logs a message to the console."""
    def load_data(self):
        console_log('ConsoleLogBasic executed', filter_expression='true')
