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
        message: 'Test Message',
        thanksMessage: 'Thank you!',
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

  describe('Repeat Options', () => {
    describe('`once`', () => {
      afterEach(() => {
        normandy.showHeartbeat.calls.reset();
        delete normandy.mock.storage.data.lastShown;
      });

      it('should NOT show if another heartbeat has ran already', async() => {
        const firstAction = new ShowHeartbeatAction(normandy, recipeFactory());
        await firstAction.execute();

        // first time should run fine
        expect(normandy.showHeartbeat).toHaveBeenCalled();

        // clear the history of calls from the testing
        normandy.showHeartbeat.calls.reset();

        const secondAction = new ShowHeartbeatAction(normandy, recipeFactory());
        await secondAction.execute();
        // second time should NOT run
        expect(normandy.showHeartbeat).not.toHaveBeenCalled();
      });

      it('should set the last-shown date', async () => {
        const action = new ShowHeartbeatAction(normandy, recipeFactory());

        spyOn(Date, 'now').and.returnValue(10);

        expect(normandy.mock.storage.data.lastShown).toBeUndefined();
        await action.execute();
        expect(normandy.mock.storage.data.lastShown).toEqual('10');
      });

      it('should show if it has not been shown already', async() => {
        const onceRecipe = recipeFactory();

        const action = new ShowHeartbeatAction(normandy, onceRecipe);
        await action.execute();

        expect(normandy.showHeartbeat).toHaveBeenCalled();
      });

      it('should NOT show if it has been shown already', async() => {
        const onceRecipe = recipeFactory();

        const action = new ShowHeartbeatAction(normandy, onceRecipe);

        // set the lastShown value in storage,
        // so heartbeat thinks it's run already before
        normandy.mock.storage.data.lastShown = '1337';

        // attempt to run it again
        await action.execute();

        // it should NOT run since it's already 'run' once before
        expect(normandy.showHeartbeat).not.toHaveBeenCalled();
      });
    });


    describe('`nag`', () => {
      afterEach(() => {
        normandy.showHeartbeat.calls.reset();
        delete normandy.mock.storage.data.lastShown;
      });

      const nagConfig = {
        arguments: {
          repeatOption: 'nag',
        },
      };

      it('should NOT show if another heartbeat has ran already', async() => {
        const firstRecipe = recipeFactory({ ...nagConfig });
        const firstAction = new ShowHeartbeatAction(normandy, firstRecipe);
        await firstAction.execute();

        // first time should run fine
        expect(normandy.showHeartbeat).toHaveBeenCalled();

        // clear the history of calls from the testing
        normandy.showHeartbeat.calls.reset();

        const secondRecipe = recipeFactory({ ...nagConfig });
        const secondAction = new ShowHeartbeatAction(normandy, secondRecipe);
        await secondAction.execute();
        // second time should NOT run
        expect(normandy.showHeartbeat).not.toHaveBeenCalled();
      });

      it('should set the last-shown date', async () => {
        const action = new ShowHeartbeatAction(normandy, recipeFactory({ ...nagConfig }));

        spyOn(Date, 'now').and.returnValue(10);

        expect(normandy.mock.storage.data.lastShown).toBeUndefined();
        await action.execute();
        expect(normandy.mock.storage.data.lastShown).toEqual('10');
      });

      it('should show if a user has not interacted with it', async () => {
        const testRecipe = recipeFactory({ ...nagConfig });
        const testAction = new ShowHeartbeatAction(normandy, testRecipe);
        await testAction.execute();
        expect(normandy.showHeartbeat).toHaveBeenCalled();
      });

      it('should not show if the user has interacted with it', async() => {
        const testAction = new ShowHeartbeatAction(normandy, recipeFactory({ ...nagConfig }));
        expect(normandy.showHeartbeat).not.toHaveBeenCalled();

        // fake the 'last interacted' value
        testAction.updateLastInteraction();

        await testAction.execute();

        expect(normandy.showHeartbeat).not.toHaveBeenCalled();
      });
    });


    describe('`xdays`', () => {
      afterEach(() => {
        normandy.showHeartbeat.calls.reset();
        delete normandy.mock.storage.data.lastShown;
      });

      const ONE_DAY = (1000 * 3600 * 24); // in milliseconds
      const repeatEvery = 7; // days
      const xdaysConfig = {
        arguments: {
          repeatOption: 'xdays',
          repeatEvery,
        },
      };

      it('should not show if less than `repeatEvery` days has elapsed', async () => {
        const action = new ShowHeartbeatAction(normandy, recipeFactory({ ...xdaysConfig }));

        let idx = 0;
        const max = repeatEvery - 1;
        for (idx; idx <= max; idx++) {
          normandy.showHeartbeat.calls.reset();
          // set last shown to be exactly `idx` days ago
          normandy.mock.storage.data.lastShown =
            Date.now() - (idx * ONE_DAY);

          await action.execute();

          expect(normandy.showHeartbeat).not.toHaveBeenCalled();
        }
      });

      it('should only show if at least `repeatEvery` days has elapsed', async () => {
        const action = new ShowHeartbeatAction(normandy, recipeFactory({ ...xdaysConfig }));

        let idx = repeatEvery;
        // check double the max amount,
        // as an arbitrary limit
        const max = idx + repeatEvery;
        for (idx; idx <= max; idx++) {
          normandy.showHeartbeat.calls.reset();
          // set last shown to be exactly [idx] days ago
          normandy.mock.storage.data.lastShown =
            Date.now() - (idx * ONE_DAY);

          await action.execute();
          expect(normandy.showHeartbeat).toHaveBeenCalled();
        }
      });

      it('should set the last-shown date', async () => {
        const action = new ShowHeartbeatAction(normandy, recipeFactory({ ...xdaysConfig }));

        spyOn(Date, 'now').and.returnValue(10);

        expect(normandy.mock.storage.data.lastShown).toBeUndefined();
        await action.execute();
        expect(normandy.mock.storage.data.lastShown).toEqual('10');
      });
    });
  });


  describe('Post-answer URL annotation', () => {
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
      expect(params.get('surveyversion')).toEqual('56');
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
  });

  // END POST-URL

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
});
