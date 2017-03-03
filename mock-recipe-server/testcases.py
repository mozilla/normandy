import json
import random
from urllib.parse import urlparse, urlunparse

from product_details import product_details

from normandy.base.utils import canonical_json_dumps
from normandy.recipes.api.serializers import ClientSerializer
from normandy.recipes.models import Action, Recipe
from normandy.recipes.tests import ClientFactory, RecipeFactory, SignatureFactory


def console_log(message, **kwargs):
    return RecipeFactory(
        action=Action.objects.get(name='console-log'),
        arguments={'message': message},
        **kwargs
    )


def show_heartbeat(**kwargs):
    return RecipeFactory(
        action=Action.objects.get(name='show-heartbeat'),
        **kwargs
    )


def generate_long_message():
    phrases = [
        'You all know the mission and what is at stake.',
        ('I have come to trust each of you with my life, but I have also heard murmurs of '
         'discontent.'),
        'I share your concerns.',
        'We are trained for espionage.',
        'We would be legends, but the records are sealed.',
        'Glory in battle is not our way.',
        'Think of our heroes: the Silent Step, who defeated a nation with a single shot.',
        'Or the Ever Alert, who kept armies at bay with hidden facts.',
        'These giants do not seem to give us solace here, but they are not all that we are.',
        'Before the network, there was the fleet.',
        'Before diplomacy, there were soldiers.',
        'Our influence stopped the rachni, but before that, we held the line.',
        'Our influence stopped the krogan, but before that, we held the line!',
        'Our influence will stop Saren! In the battle today, we will hold the line!',
    ]
    return ' '.join([random.choice(phrases) for _ in range(1000)])


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

    def serialize_api(self, api_path, domain):
        """
        Fetch API responses from the service and save them to the
        filesystem.

        :param api_path:
            APIPath object for the root URL and path to fetch and save
            responses from and to.
        :param domain:
            Protocol and domain to use for absolute URLs in the serialized
            API.
        """
        root_path = api_path.add('api', 'v1')
        self.serialize_api_root(root_path, domain)
        self.serialize_recipe_api(root_path)
        self.serialize_client_api(root_path)
        self.serialize_action_api(root_path, domain)

    def serialize_api_root(self, root_path, domain):
        root_data = json.loads(root_path.fetch())
        for name, url in root_data.items():
            root_data[name] = self.update_url(url, domain)
        root_path.save(json.dumps(root_data))

    def serialize_recipe_api(self, root_path):
        root_path.add('recipe').save()
        root_path.add('recipe', 'signed').save()

    def serialize_client_api(self, root_path):
        client = self.client()
        client_data = ClientSerializer(client).data
        client_json = canonical_json_dumps(client_data)
        root_path.add('classify_client').save(client_json)

    def serialize_action_api(self, root_path, domain):
        for action in Action.objects.all():
            # Action
            action_path = root_path.add('action', action.name)
            action_data = json.loads(action_path.fetch())

            new_url = self.update_url(action_data['implementation_url'], domain)
            action_data['implementation_url'] = new_url

            action_json = canonical_json_dumps(action_data)
            action_path.save(action_json)

            # Action implementation
            action_path.add('implementation', action.implementation_hash).save()

    def update_url(self, url, domain):
        """
        Modify the URL to use the domain and to add the name of the
        test case as the first path segment.
        """
        parsed_url = urlparse(url)
        parsed_domain = urlparse(domain)
        return urlunparse((
            parsed_domain.scheme,
            parsed_domain.netloc,
            '/' + self.name + parsed_url.path,
            parsed_url.params,
            parsed_url.query,
            parsed_url.fragment,
        ))


class FilterVersion(TestCase):
    """Matches recent Firefox versions."""
    @property
    def versions(self):
        return [
            product_details.firefox_versions['FIREFOX_NIGHTLY'],
            product_details.firefox_versions['FIREFOX_AURORA'],
            product_details.firefox_versions['LATEST_FIREFOX_DEVEL_VERSION'],
            product_details.firefox_versions['LATEST_FIREFOX_VERSION'],
        ]

    def description(self):
        version_html = ', '.join(f'<code>{version}</code>' for version in self.versions)
        return f'''
            <p class="description">
            Several recipes that match recent Firefox versions, specifically: {version_html}.
            All log to the console with the version they matched.
            </p>
        '''

    def load_data(self):
        for version in self.versions:
            console_log(
                f'FilterVersion executed: Matching version "{version}"',
                extra_filter_expression=f'normandy.version=="{version}"'
            )


class FilterChannel(TestCase):
    """
    Five recipes that match the Default (custom build), Nightly, Aurora,
    Beta, and Release channels respectively. All log to the console with
    the channel they match.
    """
    def load_data(self):
        for channel in ['default', 'nightly', 'aurora', 'beta', 'release']:
            console_log(
                f'FilterChannel executed: Matching channel "{channel}"',
                extra_filter_expression=f'normandy.channel=="{channel}"'
            )


class FilterDefaultBrowser(TestCase):
    """
    Matches if Firefox is the default browser. Logs to the console.
    """
    def load_data(self):
        console_log(
            'FilterDefaultBrowser executed',
            extra_filter_expression='normandy.isDefaultBrowser==true'
        )


class FilterGeolocationMatch(TestCase):
    """
    Matches if the server geolocates the user to the US, which this test
    case does. Logs to the console.
    """
    def client(self):
        return ClientFactory(country='US')

    def load_data(self):
        console_log(
            'FilterGeolocationMatch executed',
            extra_filter_expression='normandy.country=="US"'
        )


class FilterGeolocationNoMatch(TestCase):
    """
    Matches if the server geolocates the user to the US; the server is
    set to geolocate the user to France. Logs to the console.
    """
    def client(self):
        return ClientFactory(country='FR')

    def load_data(self):
        console_log(
            'FilterGeolocationNoMatch executed',
            extra_filter_expression='normandy.country=="US"'
        )


class FilterSample0(TestCase):
    """
    Recipe set to a 0% sample of users (effectively should never be
    run). Logs to the console.
    """
    def load_data(self):
        console_log(
            'FilterSample0 executed',
            extra_filter_expression='normandy.userId|stableSample(0)'
        )


class FilterSample100(TestCase):
    """
    Recipe set to a 100% sample of users (effectively should always be
    run). Logs to the console.
    """
    def load_data(self):
        console_log(
            'FilterSample100 executed',
            extra_filter_expression='normandy.userId|stableSample(1)'
        )


class FilterTelemetry(TestCase):
    @property
    def description(self):
        # We can't use a docstring due to the formatting for the code
        # sample.
        code = '\n'.join([
            'Components.utils.import("resource://gre/modules/TelemetryController.jsm");',
            'TelemetryController.submitExternalPing("testping", {foo: "bar"});</pre>',
        ])
        return """
            <p class="description">Matches users with a telemetry ping named <code>testping</code>
            with the payload <code>{{foo: "bar"}}</code>. You can send a telemetry ping with the
            following code pasted into the Browser Console:</p>
            <pre>{code}</pre>
        """.format(code=code)

    def load_data(self):
        console_log(
            'FilterTelemetry executed',
            extra_filter_expression='''
                telemetry.testping.payload.foo=="bar"
            '''
        )


class FilterDistribution(TestCase):
    """
    Matches the distribution "testdist", which is read from the
    <code>distribution.id</code> preference. Logs to the console.
    """
    def load_data(self):
        console_log(
            'FilterDistribution executed',
            extra_filter_expression='normandy.distribution=="testdist"'
        )


class FilterSearchEngines(TestCase):
    """Matches search engines."""
    @property
    def engines(self):
        return [
            'yahoo',
            'google-nocodes',
            'bing',
            'amazondotcom',
            'ddg',
            'twitter',
            'wikipedia',
        ]

    def description(self):
        engine_html = ', '.join(f'<code>{engine}</code>' for engine in self.engines)
        return f'''
            <p class="description">
            Several recipes that match default search engines, specifically: {engine_html}.
            All log to the console with the search engine they matched.
            </p>
        '''

    def load_data(self):
        for engine in self.engines:
            console_log(
                f'FilterSearchEngine executed: Matching search engine "{engine}"',
                extra_filter_expression=f'normandy.searchEngine=="{engine}"'
            )


class FilterSync(TestCase):
    """Matches Firefox sync status."""
    def description(self):
        return f'''
        <p class="description">Several recipes that match Firefox Sync status:</p>
        <ul>
            <li>FilterSyncDisabled matches when sync is disabled.</li>
            <li>FilterSyncEnabled matches when sync is enabled.</li>
            <li>FilterSyncDesktop matches when at least 1 desktop client is linked to sync.</li>
            <li>FilterSyncMobile matches when at least 1 mobile client is linked to sync.</li>
            <li>FilterSyncMany matches when at least 2 clients are linked to sync.</li>
        </ul>
        '''

    def load_data(self):
        console_log(
            'FilterSyncDisabled executed',
            extra_filter_expression='!normandy.syncSetup'
        )
        console_log(
            'FilterSyncEnabled executed',
            extra_filter_expression='normandy.syncSetup'
        )
        console_log(
            'FilterSyncDesktop executed',
            extra_filter_expression='normandy.syncDesktopDevices > 0'
        )
        console_log(
            'FilterSyncMobile executed',
            extra_filter_expression='normandy.syncMobileDevices > 0'
        )
        console_log(
            'FilterSyncMany executed',
            extra_filter_expression='normandy.syncTotalDevices > 1'
        )


class FilterPluginsFlash(TestCase):
    """Matches if the Flash plugin is installed. Logs to the console."""
    def load_data(self):
        console_log(
            'FilterPluginsFlash executed',
            extra_filter_expression='normandy.plugins["Shockwave Flash"]'
        )


class FilterLocales(TestCase):
    """
    Several recipes that match the locales that Firefox is available in.
    All log to the console with the locale they matched.
    """
    def load_data(self):
        for locale in product_details.languages.keys():
            console_log(
                f'FilterLocales executed: Matching locale "{locale}"',
                extra_filter_expression=f'normandy.locale=="{locale}"'
            )


class ConsoleLogBasic(TestCase):
    """Matches all clients. Logs a message to the console."""
    def load_data(self):
        console_log('ConsoleLogBasic executed', extra_filter_expression='true')


class ShowHeartbeatStars(TestCase):
    """
    Matches all clients. Shows a Heartbeat prompt with a 5-star rating
    control.
    """
    def load_data(self):
        show_heartbeat(
            extra_filter_expression='true',
            arguments={
                'includeTelemetryUUID': False,
                'surveyId': 'test-survey',
                'message': 'ShowHeartbeatStars test prompt',
                'engagementButtonLabel': '',
                'thanksMessage': 'Thanks!',
                'postAnswerUrl': 'https://www.mozilla.org',
                'learnMoreMessage': 'Learn More',
                'learnMoreUrl': 'https://wiki.mozilla.org/Firefox/Shield',
            }
        )


class ShowHeartbeatButton(TestCase):
    """
    Matches all clients. Shows a Heartbeat prompt with a clickable
    button.
    """
    def load_data(self):
        show_heartbeat(
            extra_filter_expression='true',
            arguments={
                'includeTelemetryUUID': False,
                'surveyId': 'test-survey',
                'message': 'ShowHeartbeatButton test prompt',
                'engagementButtonLabel': 'Click me!',
                'thanksMessage': 'Thanks!',
                'postAnswerUrl': 'https://www.mozilla.org',
                'learnMoreMessage': 'Learn More',
                'learnMoreUrl': 'https://wiki.mozilla.org/Firefox/Shield',
            }
        )


class FilterLongExpression(TestCase):
    """
    Matches all clients using a <em>very long</em> filter expression. Logs to
    the console.
    """
    def load_data(self):
        truthy_choices = [
            'true',
            '1 + 7 == 8',
            '5 > 4',
            '((4 * 8) - 12) > -5',
            '4 in [1, 2, 4]',
            '{foo: "bar"}.foo == "bar"',
            '"bar" in "foobarbaz"',
            'normandy.userId|stableSample(1)',
        ]
        truthy_expressions = [random.choice(truthy_choices) for _ in range(1000)]
        filter_expression = '&&'.join(['({})'.format(expr) for expr in truthy_expressions])
        console_log('FilterLongExpression executed', extra_filter_expression=filter_expression)


class ConsoleLogLongMessage(TestCase):
    """
    Matches all clients. Logs to the console with a <em>very long</em>
    message.
    """
    def load_data(self):
        message = generate_long_message()
        console_log('ConsoleLogLongMessage executed: ' + message, extra_filter_expression='true')


class HeartbeatLongMessages(TestCase):
    """
    Matches all clients. Shows a Heartbeat prompt with
    <em>very long</em> strings.
    """
    def load_data(self):
        message = generate_long_message()
        show_heartbeat(
            extra_filter_expression='true',
            arguments={
                'includeTelemetryUUID': False,
                'surveyId': 'test-survey',
                'message': message,
                'engagementButtonLabel': message,
                'thanksMessage': message,
                'postAnswerUrl': 'https://www.mozilla.org',
                'learnMoreMessage': message,
                'learnMoreUrl': 'https://wiki.mozilla.org/Firefox/Shield',
            }
        )


class ErrorMissingAPI(TestCase):
    """Returns a 404 Not Found response."""
    def serialize_recipe_api(self, root_path):
        pass  # No recipe API == 404!


class ErrorMalformedJSON(TestCase):
    """Returns invalid JSON in the server response."""
    def serialize_recipe_api(self, root_path):
        root_path.add('recipe').save('{invalid: "JSON"[ %2}')
        root_path.add('recipe', 'signed').save('&invalid" JSON')


class ErrorInvalidSignature(TestCase):
    """
    Returns a recipe with invalid signatures, which should not be
    executed. If it does anyway, it will log to the console.
    """
    def load_data(self):
        recipe = console_log('ErrorInvalidSignature executed', extra_filter_expression='true')
        recipe.signature = SignatureFactory.create(data='blockbuster night part 1'.encode())
        recipe.save()
