import { mockNormandy, pluginFactory } from './utils';
import ShowHeartbeatAction from '../show-heartbeat/';


function recipeFactory(props = {}) {
  // If we leave arguments, it will overwrite itself below.
  const args = props.arguments;
  delete props.arguments;

  return {
    id: 1,
    revision_id: 1,
    arguments: {
      surveyId: 'mysurvey',
      message: 'test message',
      engagementButtonLabel: '',
      thanksMessage: 'thanks!',
      postAnswerUrl: 'http://example.com',
      learnMoreMessage: 'Learn More',
      learnMoreUrl: 'http://example.com',
      ...args,
    },
    ...props,
  };
}


describe('ShowHeartbeatAction', () => {
  let normandy;

  beforeEach(() => {
    normandy = mockNormandy();
  });

  it('should run without errors', async () => {
    const action = new ShowHeartbeatAction(normandy, recipeFactory());
    await action.execute();
  });

  it('should not show heartbeat if it has shown within the past 7 days', async () => {
    const recipe = recipeFactory();
    const action = new ShowHeartbeatAction(normandy, recipe);

    normandy.mock.storage.data.lastShown = '100';
    spyOn(Date, 'now').and.returnValue(10);

    await action.execute();
    expect(normandy.showHeartbeat).not.toHaveBeenCalled();
  });

  it('should show heartbeat in testing mode regardless of when it was last shown', async () => {
    const recipe = recipeFactory();
    const action = new ShowHeartbeatAction(normandy, recipe);

    normandy.testing = true;
    normandy.mock.storage.data.lastShown = '100';
    spyOn(Date, 'now').and.returnValue(10);

    await action.execute();
    expect(normandy.showHeartbeat).toHaveBeenCalled();
  });

  it("should show heartbeat if it hasn't shown within the past 7 days", async () => {
    const recipe = recipeFactory();
    const action = new ShowHeartbeatAction(normandy, recipe);

    normandy.mock.storage.data.lastShown = '100';
    spyOn(Date, 'now').and.returnValue(9999999999);

    await action.execute();
    expect(normandy.showHeartbeat).toHaveBeenCalled();
  });

  it('should show heartbeat if the last-shown date is null', async () => {
    const recipe = recipeFactory();
    const action = new ShowHeartbeatAction(normandy, recipe);

    normandy.mock.storage.data.lastShown = null;
    spyOn(Date, 'now').and.returnValue(10);

    await action.execute();
    expect(normandy.showHeartbeat).toHaveBeenCalled();
  });

  it('should pass the correct arguments to showHeartbeat', async () => {
    const showHeartbeatArgs = {
      arguments: {
        message: 'test message',
        thanksMessage: 'thanks!',
        learnMoreMessage: 'Learn More',
        learnMoreUrl: 'http://example.com',
      },
    };
    const recipe = recipeFactory(showHeartbeatArgs);
    const action = new ShowHeartbeatAction(normandy, recipe);

    normandy.uuid.and.returnValue('fake-uuid');

    await action.execute();
    expect(normandy.showHeartbeat).toHaveBeenCalledWith(
            jasmine.objectContaining(showHeartbeatArgs)
        );
  });

  it('should generate a UUID and pass it to showHeartbeat', async () => {
    const recipe = recipeFactory();
    const action = new ShowHeartbeatAction(normandy, recipe);

    normandy.uuid.and.returnValue('fake-uuid');

    await action.execute();
    expect(normandy.showHeartbeat).toHaveBeenCalledWith(jasmine.objectContaining({
      flowId: 'fake-uuid',
    }));
  });

  it('should not bother to annotate an empty post-answer URL', async () => {
    const recipe = recipeFactory({
      arguments: {
        postAnswerUrl: '',
      },
    });
    const action = new ShowHeartbeatAction(normandy, recipe);

    await action.execute();
    const postAnswerUrl = normandy.showHeartbeat.calls.argsFor(0)[0].postAnswerUrl;
    expect(postAnswerUrl).toEqual('');
  });

  it('should annotate the post-answer URL with extra query args', async () => {
    const url = 'https://example.com';
    const recipe = recipeFactory({
      arguments: {
        postAnswerUrl: url,
      },
    });
    const action = new ShowHeartbeatAction(normandy, recipe);

    normandy.mock.client.version = '42.0.1';
    normandy.mock.client.channel = 'nightly';
    normandy.mock.client.isDefaultBrowser = true;
    normandy.mock.client.searchEngine = 'shady-tims';
    normandy.mock.client.syncSetup = true;

    await action.execute();
    const postAnswerUrl = normandy.showHeartbeat.calls.argsFor(0)[0].postAnswerUrl;
    const params = new URL(postAnswerUrl).searchParams;
    expect(params.get('source')).toEqual('heartbeat');
    expect(params.get('surveyversion')).toEqual('52');
    expect(params.get('updateChannel')).toEqual('nightly');
    expect(params.get('fxVersion')).toEqual('42.0.1');
    expect(params.get('isDefaultBrowser')).toEqual('1');
    expect(params.get('searchEngine')).toEqual('shady-tims');
    expect(params.get('syncSetup')).toEqual('1');
  });

  it('should annotate the post-answer URL if it has an existing query string', async () => {
    const url = 'https://example.com?foo=bar';
    const recipe = recipeFactory({
      arguments: {
        postAnswerUrl: url,
      },
    });
    const action = new ShowHeartbeatAction(normandy, recipe);

    normandy.mock.client.version = '42.0.1';
    normandy.mock.client.channel = 'nightly';

    await action.execute();
    const postAnswerUrl = normandy.showHeartbeat.calls.argsFor(0)[0].postAnswerUrl;
    const params = new URL(postAnswerUrl).searchParams;
    expect(params.get('foo')).toEqual('bar');
    expect(params.get('source')).toEqual('heartbeat');
  });

  it('should annotate the post-answer URL with a testing param in testing mode', async () => {
    const url = 'https://example.com';
    const recipe = recipeFactory({
      arguments: {
        postAnswerUrl: url,
      },
    });
    const action = new ShowHeartbeatAction(normandy, recipe);

    normandy.testing = true;

    await action.execute();
    const postAnswerUrl = normandy.showHeartbeat.calls.argsFor(0)[0].postAnswerUrl;
    const params = new URL(postAnswerUrl).searchParams;
    expect(params.get('testing')).toEqual('1');
  });

  it('should pass some extra telemetry arguments to showHeartbeat', async () => {
    const recipe = recipeFactory({
      revision_id: 42,
      arguments: {
        surveyId: 'my-survey',
      },
    });
    const action = new ShowHeartbeatAction(normandy, recipe);

    await action.execute();
    expect(normandy.showHeartbeat).toHaveBeenCalledWith(jasmine.objectContaining({
      surveyId: 'my-survey',
      surveyVersion: 42,
    }));
  });

  it('should include a testing argument when in testing mode', async () => {
    const recipe = recipeFactory({
      revision_id: 42,
      arguments: {
        surveyId: 'my-survey',
      },
    });
    const action = new ShowHeartbeatAction(normandy, recipe);

    normandy.testing = true;

    await action.execute();
    expect(normandy.showHeartbeat).toHaveBeenCalledWith(jasmine.objectContaining({
      testing: 1,
    }));
  });

  it('should set the last-shown date', async () => {
    const action = new ShowHeartbeatAction(normandy, recipeFactory());

    spyOn(Date, 'now').and.returnValue(10);

    expect(normandy.mock.storage.data.lastShown).toBeUndefined();
    await action.execute();
    expect(normandy.mock.storage.data.lastShown).toEqual('10');
  });

  it('should save flow data via normandy.saveHeartbeatFlow', async () => {
    const recipe = recipeFactory();
    const action = new ShowHeartbeatAction(normandy, recipe);

    const client = normandy.mock.client;
    client.plugins = {
      'Shockwave Flash': pluginFactory({
        name: 'Shockwave Flash',
        version: '2.5.0',
      }),
      'Another Plugin': pluginFactory({
        name: 'Another Plugin',
        version: '7',
      }),
    };
    spyOn(Date, 'now').and.returnValue(10);
    normandy.testing = true;

    await action.execute();

    const emitter = normandy.mock.heartbeatEmitter;
    emitter.emit('NotificationOffered', { timestamp: 20 });
    emitter.emit('LearnMore', { timestamp: 30 });
    emitter.emit('Voted', { timestamp: 40, score: 3 });
    emitter.emit('Engaged', { timestamp: 50 });

    // Checking per field makes recognizing which field failed
    // _much_ easier.
    const flowData = normandy.saveHeartbeatFlow.calls.mostRecent().args[0];
    expect(flowData.response_version).toEqual(2);
    expect(flowData.survey_id).toEqual(recipe.arguments.surveyId);
    expect(flowData.question_id).toEqual(recipe.arguments.message);
    expect(flowData.updated_ts).toEqual(10);
    expect(flowData.question_text).toEqual(recipe.arguments.message);
    expect(flowData.variation_id).toEqual(recipe.revision_id.toString());
    expect(flowData.score).toEqual(3);
    expect(flowData.flow_began_ts).toEqual(10);
    expect(flowData.flow_offered_ts).toEqual(20);
    expect(flowData.flow_voted_ts).toEqual(40);
    expect(flowData.flow_engaged_ts).toEqual(50);
    expect(flowData.channel).toEqual(client.channel);
    expect(flowData.version).toEqual(client.version);
    expect(flowData.locale).toEqual(normandy.locale);
    expect(flowData.country).toEqual(normandy.mock.location.countryCode);
    expect(flowData.is_test).toEqual(true);
    expect(flowData.extra.plugins).toEqual({
      'Shockwave Flash': '2.5.0',
      'Another Plugin': '7',
    });
    expect(flowData.extra.flashVersion).toEqual(client.plugins['Shockwave Flash'].version);
    expect(flowData.extra.engage).toEqual([
            [10, recipe.arguments.learnMoreUrl, 'notice'],
    ]);
    expect(flowData.extra.searchEngine).toEqual(client.searchEngine);
    expect(flowData.extra.syncSetup).toEqual(client.syncSetup);
    expect(flowData.extra.defaultBrowser).toEqual(client.isDefaultBrowser);
  });

  it('should truncate long values in flow data', async () => {
    const longString = 'A 50 character string.............................';
    const tooLongString = `${longString}XXXXXXXXXX`;

    const recipe = recipeFactory({
      arguments: {
        message: tooLongString,
      },
    });
    const action = new ShowHeartbeatAction(normandy, recipe);

    normandy.locale = tooLongString;
    normandy.mock.client.channel = tooLongString;
    normandy.mock.client.version = tooLongString;
    normandy.mock.location.countryCode = tooLongString;

    await action.execute();

    // Checking per field makes recognizing which field failed _much_
    // easier.
    const flowData = normandy.saveHeartbeatFlow.calls.mostRecent().args[0];
    expect(flowData.question_id).toEqual(longString);
    expect(flowData.locale).toEqual(longString);
    expect(flowData.channel).toEqual(longString);
    expect(flowData.version).toEqual(longString);
    expect(flowData.country).toEqual('a 50');
  });
});
