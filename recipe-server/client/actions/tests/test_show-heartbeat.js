import { mockNormandy } from './utils';
import ShowHeartbeatAction from '../show-heartbeat/';
import { recipeFactory } from '../../tests/utils.js';

describe('ShowHeartbeatAction', () => {
  let normandy;

  beforeEach(() => {
    normandy = mockNormandy();
  });

  it('should run without errors', async () => {
    const action = new ShowHeartbeatAction(normandy, recipeFactory());
    await action.execute();
  });

  // it('should show heartbeat if it has not been shown yet', async() => {
  //   const recipe = recipeFactory();
  //   const action = new ShowHeartbeatAction(normandy, recipe);

  //   normandy.mock.storage.data.lastShown = null;
  //   spyOn(Date, 'now').and.returnValue(99999999);

  //   await action.execute();
  //   expect(normandy.showHeartbeat).toHaveBeenCalled();
  // });

  // it('should NOT show heartbeat if it has been shown already', async() => {
  //   const recipe = recipeFactory();
  //   const action = new ShowHeartbeatAction(normandy, recipe);

  //   // set the lastShown value in storage,
  //   // so heartbeat thinks it's run already before
  //   normandy.mock.storage.data.lastShown = '100';

  //   // attempt to run it again
  //   await action.execute();

  //   // it should NOT run since it's already 'run' once before
  //   expect(normandy.showHeartbeat).not.toHaveBeenCalled();
  // });

  it('should show heartbeat in testing mode regardless of when it was last shown', async () => {
    const recipe = recipeFactory();
    const action = new ShowHeartbeatAction(normandy, recipe);

    normandy.testing = true;
    normandy.mock.storage.data.lastShown = '100';
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
    expect(params.get('surveyversion')).toEqual('55');
    expect(params.get('updateChannel')).toEqual('nightly');
    expect(params.get('fxVersion')).toEqual('42.0.1');
    expect(params.get('isDefaultBrowser')).toEqual('1');
    expect(params.get('searchEngine')).toEqual('shady-tims');
    expect(params.get('syncSetup')).toEqual('1');

    // telemetry data is turned off, so no userId should be passed into params
    expect(params.get('userId')).toBeNull();
  });


  it('should annotate the post-answer URL with google analytics params', async () => {
    const url = 'https://example.com';
    const recipe = recipeFactory({
      action: 'show-heartbeat',
      arguments: {
        postAnswerUrl: url,
        message: 'This is a test message!!',
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
    expect(params.get('utm_source')).toEqual('firefox');
    expect(params.get('utm_medium')).toEqual('show-heartbeat');
    expect(params.get('utm_campaign')).toEqual('Thisisatestmessage%21%21');
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

  it('should pass a UUID telemetry argument when the recipe calls for it', async () => {
    const recipe = recipeFactory({
      revision_id: 42,
      arguments: {
        surveyId: 'my-survey',
        includeTelemetryUUID: true,
      },
    });
    const action = new ShowHeartbeatAction(normandy, recipe);

    await action.execute();

    // userId should be set
    expect(normandy.userId).not.toBeNull();

    // userId should be uuid4
    const UUID_ISH_REGEX = /^[a-f0-9-]{36}$/;
    expect(normandy.userId).toMatch(UUID_ISH_REGEX);

    expect(normandy.showHeartbeat).toHaveBeenCalledWith(jasmine.objectContaining({
      // returned surveyId should be `name::uuid`
      surveyId: `my-survey::${normandy.userId}`,
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
});
