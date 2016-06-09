import {mockNormandy, pluginFactory} from './utils';
import ShowHeartbeatAction from '../../static/actions/show-heartbeat/index';


function surveyFactory(props={}) {
    return Object.assign({
        title: 'test survey',
        message: 'test message',
        engagementButtonLabel: '',
        thanksMessage: 'thanks!',
        postAnswerUrl: 'http://example.com',
        learnMoreMessage: 'Learn More',
        learnMoreUrl: 'http://example.com',
        weight: 100,
    }, props);
}


function recipeFactory(props={}) {
    return Object.assign({
        id: 1,
        revision_id: 1,
        arguments: {
            surveyId: 'mysurvey',
            defaults: {},
            surveys: [surveyFactory()],
        },
    }, props);
}


describe('ShowHeartbeatAction', function() {
    beforeEach(function() {
        this.normandy = mockNormandy();
    });

    it('should run without errors', async function() {
        let action = new ShowHeartbeatAction(this.normandy, recipeFactory());
        await action.execute();
    });

    it('should not show heartbeat if it has shown within the past 7 days', async function() {
        let recipe = recipeFactory();
        let action = new ShowHeartbeatAction(this.normandy, recipe);

        this.normandy.mock.storage.data['lastShown'] = '100';
        spyOn(Date, 'now').and.returnValue(10);

        await action.execute();
        expect(this.normandy.showHeartbeat).not.toHaveBeenCalled();
    });

    it('should show heartbeat in testing mode regardless of when it was last shown', async function() {
        let recipe = recipeFactory();
        let action = new ShowHeartbeatAction(this.normandy, recipe);

        this.normandy.testing = true;
        this.normandy.mock.storage.data['lastShown'] = '100';
        spyOn(Date, 'now').and.returnValue(10);

        await action.execute();
        expect(this.normandy.showHeartbeat).toHaveBeenCalled();
    });

    it("should show heartbeat if it hasn't shown within the past 7 days", async function() {
        let recipe = recipeFactory();
        let action = new ShowHeartbeatAction(this.normandy, recipe);

        this.normandy.mock.storage.data['lastShown'] = '100';
        spyOn(Date, 'now').and.returnValue(9999999999);

        await action.execute();
        expect(this.normandy.showHeartbeat).toHaveBeenCalled();
    });

    it('should show heartbeat if the last-shown date cannot be parsed', async function() {
        let recipe = recipeFactory();
        let action = new ShowHeartbeatAction(this.normandy, recipe);

        this.normandy.mock.storage.data['lastShown'] = 'bigo310s0baba';
        spyOn(Date, 'now').and.returnValue(10);

        await action.execute();
        expect(this.normandy.showHeartbeat).toHaveBeenCalled();
    });

    it('should pass the correct arguments to showHeartbeat', async function() {
        let showHeartbeatArgs = {
            message: 'test message',
            thanksMessage: 'thanks!',
            learnMoreMessage: 'Learn More',
            learnMoreUrl: 'http://example.com',
        };
        let recipe = recipeFactory(showHeartbeatArgs);
        let action = new ShowHeartbeatAction(this.normandy, recipe);

        this.normandy.uuid.and.returnValue('fake-uuid');

        await action.execute();
        expect(this.normandy.showHeartbeat).toHaveBeenCalledWith(
            jasmine.objectContaining(showHeartbeatArgs)
        );
    });

    it('should generate a UUID and pass it to showHeartbeat', async function() {
        let recipe = recipeFactory();
        let action = new ShowHeartbeatAction(this.normandy, recipe);

        this.normandy.uuid.and.returnValue('fake-uuid');

        await action.execute();
        expect(this.normandy.showHeartbeat).toHaveBeenCalledWith(jasmine.objectContaining({
            flowId: 'fake-uuid',
        }));
    });

    it('should annotate the post-answer URL with extra query args', async function() {
        let url = 'https://example.com';
        let recipe = recipeFactory();
        recipe.arguments.surveys[0].postAnswerUrl = url;
        let action = new ShowHeartbeatAction(this.normandy, recipe);

        this.normandy.mock.client.version = '42.0.1';
        this.normandy.mock.client.channel = 'nightly';

        await action.execute();
        expect(this.normandy.showHeartbeat).toHaveBeenCalledWith(jasmine.objectContaining({
            postAnswerUrl: (url + '?source=heartbeat&surveyversion=52' +
                            '&updateChannel=nightly&fxVersion=42.0.1'),
        }));
    });

    it('should annotate the post-answer URL if it has an existing query string', async function() {
        let url = 'https://example.com?foo=bar';
        let recipe = recipeFactory();
        recipe.arguments.surveys[0].postAnswerUrl = url;
        let action = new ShowHeartbeatAction(this.normandy, recipe);

        this.normandy.mock.client.version = '42.0.1';
        this.normandy.mock.client.channel = 'nightly';

        await action.execute();
        expect(this.normandy.showHeartbeat).toHaveBeenCalledWith(jasmine.objectContaining({
            postAnswerUrl: (url + '&source=heartbeat&surveyversion=52' +
                            '&updateChannel=nightly&fxVersion=42.0.1'),
        }));
    });

    it('should annotate the post-answer URL with a testing param in testing mode', async function() {
        let url = 'https://example.com';
        let recipe = recipeFactory();
        recipe.arguments.surveys[0].postAnswerUrl = url;
        let action = new ShowHeartbeatAction(this.normandy, recipe);

        this.normandy.testing = true;
        this.normandy.mock.client.version = '42.0.1';
        this.normandy.mock.client.channel = 'nightly';

        await action.execute();
        expect(this.normandy.showHeartbeat).toHaveBeenCalledWith(jasmine.objectContaining({
            postAnswerUrl: (url + '?source=heartbeat&surveyversion=52' +
                            '&updateChannel=nightly&fxVersion=42.0.1&testing=1'),
        }));
    });

    it('should pass some extra telemetry arguments to showHeartbeat', async function() {
        let recipe = recipeFactory({revision_id: 42});
        recipe.arguments.surveyId = 'my-survey';
        let action = new ShowHeartbeatAction(this.normandy, recipe);

        await action.execute();
        expect(this.normandy.showHeartbeat).toHaveBeenCalledWith(jasmine.objectContaining({
            surveyId: 'my-survey',
            surveyVersion: 42,
        }));
    });

    it('should include a testing argument when in testing mode', async function() {
        let recipe = recipeFactory({revision_id: 42});
        recipe.arguments.surveyId = 'my-survey';
        let action = new ShowHeartbeatAction(this.normandy, recipe);

        this.normandy.testing = true;

        await action.execute();
        expect(this.normandy.showHeartbeat).toHaveBeenCalledWith(jasmine.objectContaining({
            testing: 1
        }));
    });

    it('should set the last-shown date', async function() {
        let action = new ShowHeartbeatAction(this.normandy, recipeFactory());

        spyOn(Date, 'now').and.returnValue(10);

        expect(this.normandy.mock.storage.data['lastShown']).toBeUndefined();
        await action.execute();
        expect(this.normandy.mock.storage.data['lastShown']).toEqual('10');
    });

    it('should choose a random survey based on the weights', async function() {
        // This test relies on the order of surveys passed in, which sucks.
        let survey20 = surveyFactory({message: 'survey20', weight: 20});
        let survey30 = surveyFactory({message: 'survey30', weight: 30});
        let survey50 = surveyFactory({message: 'survey50', weight: 50});
        let recipe = recipeFactory({arguments: {surveys: [survey20, survey30, survey50]}});

        spyOn(Math, 'random').and.returnValues(0.1, 0.4);

        let action = new ShowHeartbeatAction(this.normandy, recipe);
        await action.execute();
        expect(this.normandy.showHeartbeat).toHaveBeenCalledWith(jasmine.objectContaining({
            message: survey20.message,
        }));

        // If the random number changes, return a different survey.
        this.normandy = mockNormandy();
        action = new ShowHeartbeatAction(this.normandy, recipe);
        await action.execute();
        expect(this.normandy.showHeartbeat).toHaveBeenCalledWith(jasmine.objectContaining({
            message: survey30.message,
        }));
    });

    it('should save flow data via normandy.saveHeartbeatFlow', async function() {
        let recipe = recipeFactory();
        let survey = recipe.arguments.surveys[0];
        let action = new ShowHeartbeatAction(this.normandy, recipe);

        let client = this.normandy.mock.client;
        client.plugins = {
            'Shockwave Flash': pluginFactory({
                name: 'Shockwave Flash',
                version: '2.5.0',
            }),
            'otherplugin': pluginFactory({
                name: 'otherplugin',
                version: '7',
            }),
        };
        spyOn(Date, 'now').and.returnValue(10);
        this.normandy.testing = true;

        await action.execute();

        let emitter = this.normandy.mock.heartbeatEmitter;
        emitter.emit('NotificationOffered', {timestamp: 20});
        emitter.emit('LearnMore', {timestamp: 30});
        emitter.emit('Voted', {timestamp: 40, score: 3});

        // Checking per field makes recognizing which field failed
        // _much_ easier.
        let flowData = this.normandy.saveHeartbeatFlow.calls.mostRecent().args[0];
        expect(flowData.response_version).toEqual(2);
        expect(flowData.survey_id).toEqual(recipe.arguments.surveyId);
        expect(flowData.question_id).toEqual(survey.message);
        expect(flowData.updated_ts).toEqual(10);
        expect(flowData.question_text).toEqual(survey.message);
        expect(flowData.variation_id).toEqual(recipe.revision_id.toString());
        expect(flowData.score).toEqual(3);
        expect(flowData.flow_began_ts).toEqual(10);
        expect(flowData.flow_offered_ts).toEqual(20);
        expect(flowData.flow_voted_ts).toEqual(40);
        expect(flowData.channel).toEqual(client.channel);
        expect(flowData.version).toEqual(client.version);
        expect(flowData.locale).toEqual(this.normandy.locale);
        expect(flowData.country).toEqual(this.normandy.mock.location.countryCode);
        expect(flowData.is_test).toEqual(true);
        expect(flowData.extra.plugins).toEqual({
            'Shockwave Flash': '2.5.0',
            'otherplugin': '7',
        });
        expect(flowData.extra.flashVersion).toEqual(client.plugins['Shockwave Flash'].version);
        expect(flowData.extra.engage).toEqual([
            [10, survey.learnMoreUrl, 'notice'],
        ]);
        expect(flowData.extra.searchEngine).toEqual(client.searchEngine);
        expect(flowData.extra.syncSetup).toEqual(client.syncSetup);
        expect(flowData.extra.defaultBrowser).toEqual(client.isDefaultBrowser);
    });

    it('should truncate long values in flow data', async function() {
        let longString = 'A 50 character string.............................';
        let tooLongString = longString + 'XXXXXXXXXX';

        let recipe = recipeFactory();
        let action = new ShowHeartbeatAction(this.normandy, recipe);
        let survey = recipe.arguments.surveys[0];

        survey.message = tooLongString;
        this.normandy.locale = tooLongString;
        this.normandy.mock.client.channel = tooLongString;
        this.normandy.mock.client.version = tooLongString;
        this.normandy.mock.location.countryCode = tooLongString;

        await action.execute();

        // Checking per field makes recognizing which field failed
        // _much_ easier.
        let flowData = this.normandy.saveHeartbeatFlow.calls.mostRecent().args[0];
        expect(flowData.question_id).toEqual(longString);
        expect(flowData.locale).toEqual(longString);
        expect(flowData.channel).toEqual(longString);
        expect(flowData.version).toEqual(longString);
        expect(flowData.country).toEqual('a 50');
    });
});
