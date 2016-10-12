import fetchMock from 'fetch-mock';

import NormandyDriver, {
  HeartbeatEmitter,
  LocalStorage,
  STORAGE_DURABILITY_KEY,
} from '../normandy_driver.js';
import { urlPathMatcher } from '../../tests/utils.js';

describe('Normandy Driver', () => {
  describe('showHeartbeat', () => {
    const options = {
      message: 'testMessage',
      thanksMessage: 'testThanks',
      flowId: 'testFlowId',
      postAnswerUrl: 'testPostAnswerUrl',
      learnMoreMessage: 'testLearnMoreMessage',
      learnMoreUrl: 'testLearnMoreUrl',
      engagementButtonLabel: 'testEngagementButtonLabel',
      surveyId: 'testSurveyId',
      surveyVersion: 'testSurveyVersion',
      testing: true,
    };

    it('should pass all the required arguments to the UITour helper', async () => {
      const uitour = jasmine.createSpyObj('uitour', ['showHeartbeat']);
      const driver = new NormandyDriver(uitour);

      const emitter = await driver.showHeartbeat(options);
      expect(emitter instanceof HeartbeatEmitter).toEqual(true);
      expect(uitour.showHeartbeat).toHaveBeenCalledWith(
        options.message,
        options.thanksMessage,
        options.flowId,
        options.postAnswerUrl,
        options.learnMoreMessage,
        options.learnMoreUrl,
        jasmine.objectContaining({
          engagementButtonLabel: options.engagementButtonLabel,
          surveyId: options.surveyId,
          surveyVersion: options.surveyVersion,
          testing: options.testing,
        }),
      );
    });

    it('should emit events when UITour emits them', async () => {
      let observer = null;
      const uitour = {
        showHeartbeat: jasmine.createSpy('showHeartbeat'),
        observe(func) {
          observer = func;
        },
      };

      const driver = new NormandyDriver(uitour);
      driver.registerCallbacks();
      const emitter = await driver.showHeartbeat(options);
      const offerSpy = jasmine.createSpy('OfferListener');
      // flowId ties this offer to the showHeartbeat call
      const offerData = { foo: 'bar', flowId: options.flowId };

      // Manually emit offer event to UITour observer and check if the
      // callback is called.
      emitter.on('NotificationOffered', offerSpy);
      observer('Heartbeat:NotificationOffered', offerData);
      expect(offerSpy).toHaveBeenCalledWith(offerData);
    });
  });

  describe('saveHeartbeatFlow', () => {
    const driver = new NormandyDriver();

    afterEach(() => {
      expect(fetchMock.calls().unmatched).toEqual([]);
      fetchMock.restore();
    });

    beforeEach(() => {
      fetchMock.get(urlPathMatcher('/api/v2/hb/'), 200);
    });

    it('should not POST data if in testing mode', async () => {
      driver.testing = true;
      await driver.saveHeartbeatFlow({
        flowId: '123456789',
      });

      expect(fetchMock.calls().matched.length).toEqual(0);
    });

    it('should POST flow data to input', async () => {
      driver.testing = false;
      await driver.saveHeartbeatFlow({
        flowId: '123456789',
      });

      expect(fetchMock.lastOptions()).toEqual({
        method: 'POST',
        body: '{"flowId":"123456789"}',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('client', () => {
    it("should fetch the user's config from UITour", async () => {
      const uitour = {
        getConfiguration(config, cb) {
          switch (config) {
            case 'sync':
              return cb({
                setup: true,
                desktopDevices: 1,
                mobileDevices: 2,
                totalDevices: 3,
              });
            case 'appinfo':
              return cb({
                version: '50.0.2',
                defaultUpdateChannel: 'aurora',
                defaultBrowser: true,
                distribution: 'funnelcake85',
              });
            case 'selectedSearchEngine':
              return cb({ searchEngineIdentifier: 'Yahoo' });
            default:
              return cb({});
          }
        },
      };
      const driver = new NormandyDriver(uitour);
      const client = await driver.client();

      expect(client.syncSetup).toEqual(true);
      expect(client.syncDesktopDevices).toEqual(1);
      expect(client.syncMobileDevices).toEqual(2);
      expect(client.syncTotalDevices).toEqual(3);
      expect(client.distribution).toEqual('funnelcake85');
      expect(client.isDefaultBrowser).toEqual(true);
      expect(client.searchEngine).toEqual('Yahoo');
    });
  });

  describe('uuid', () => {
    it('returns a valid userID', () => {
      const UUID_ISH_REGEX = /^[a-f0-9-]{36}$/;
      const driver = new NormandyDriver();
      const uuid = driver.uuid();
      expect(UUID_ISH_REGEX.test(uuid)).toBe(true);
    });
  });

  describe('log', () => {
    const driver = new NormandyDriver();

    it('will not log debug level unless in testing mode', () => {
      spyOn(console, 'log');
      driver.testing = false;
      driver.log('lorem ipsum');
      expect(console.log.calls.count()).toEqual(0);
    });

    it('will log debug messages in testing mode', () => {
      spyOn(console, 'log');
      driver.testing = true;
      driver.log('lorem ipsum');
      driver.log('lorem ipsum dolor', 'debug');
      expect(console.log.calls.count()).toEqual(2);
    });

    it('will log an error if level is set to error', () => {
      spyOn(console, 'error');
      driver.log('lorem ipsum', 'error');
      expect(console.error.calls.count()).toEqual(1);
    });
  });

  describe('HeartbeatEmitter', () => {
    let emitter = null;
    beforeEach(() => {
      emitter = new HeartbeatEmitter();
    });

    it('does not allow invalid event handlers', () => {
      expect(() => {
        emitter.on('invalid', () => true);
      }).toThrow();
    });

    it('cannot emit an event more than once', () => {
      emitter.emit('Voted', {});
      expect(() => {
        emitter.emit('Voted', {});
      }).toThrow();
    });

    it('emits events synchronously', () => {
      const data = { foo: 1 };
      const spy = jasmine.createSpy('VotedCallback');
      emitter.on('Voted', spy);
      emitter.emit('Voted', data);
      expect(spy).toHaveBeenCalledWith(data);
    });

    it('can emit to multiple callbacks', () => {
      const data = { foo: 1 };
      const spy = jasmine.createSpy('VotedCallback');
      const spy2 = jasmine.createSpy('VotedCallback2');
      emitter.on('Voted', spy);
      emitter.on('Voted', spy2);
      emitter.emit('Voted', data);
      expect(spy).toHaveBeenCalledWith(data);
      expect(spy2).toHaveBeenCalledWith(data);
    });

    it('immediately calls callbacks for already-emitted events', () => {
      const data = { foo: 1 };
      emitter.emit('Voted', data);

      const spy = jasmine.createSpy('VotedCallback');
      emitter.on('Voted', spy);
      expect(spy).toHaveBeenCalledWith(data);
    });
  });
});

describe('LocalStorage', () => {
  let store;

  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(STORAGE_DURABILITY_KEY, 2);
    store = new LocalStorage('test-prefix');
  });

  it('can set and get items', async () => {
    await store.setItem('key', 'value');
    expect(await store.getItem('key')).toEqual('value');
  });

  it("returns null for values that haven't been set", async () => {
    expect(await store.getItem('absent')).toBeNull();
  });

  it("can remove items after they've been set", async () => {
    await store.setItem('toBeRemoved', 'value');
    expect(await store.getItem('toBeRemoved')).toEqual('value');
    await store.removeItem('toBeRemoved');
    expect(await store.getItem('toBeRemoved')).toBeNull();
  });

  it('fails if storage is not known to be durable', async () => {
    window.localStorage.setItem(STORAGE_DURABILITY_KEY, 0);
    try {
      await store.getItem('value');
      throw new Error('Did not throw error');
    } catch (err) {
      expect(err).toEqual(new Error('Storage durability unconfirmed'));
    }
  });

  describe('tests are independent', () => {
    // If the tests are not independent, the one of these that runs second will fail
    it('should not leak data between tests part 1', async () => {
      const val = await store.getItem('counter') || 0;
      await store.setItem('counter', val + 1);
      expect(await store.getItem('counter')).toEqual(1);
    });

    it('should not leak data between tests part 2', async () => {
      const val = await store.getItem('counter') || 0;
      await store.setItem('counter', val + 1);
      expect(await store.getItem('counter')).toEqual(1);
    });
  });
});
