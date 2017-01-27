import NormandyDriver, {
  HeartbeatEmitter,
  LocalStorage,
  STORAGE_DURABILITY_KEY,
} from '../normandy_driver.js';
import { MockStorage } from '../../actions/tests/utils.js';

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

  describe('client', () => {
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

    it("should fetch the user's config from UITour", async () => {
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

    it('should pull plugin data from navigator.plugins', async () => {
      const flashPlugin = {
        name: 'Shockwave Flash',
        description: 'Literally the worst',
        version: 'v0.1.2',
        filename: 'foo.xpi',
      };
      const navigator = {
        plugins: [flashPlugin],
      };
      const driver = new NormandyDriver(uitour, navigator);
      const client = await driver.client();

      expect(Object.keys(client.plugins).length).toEqual(1);

      const clientPlugin = client.plugins['Shockwave Flash'];
      expect(clientPlugin.name).toEqual(flashPlugin.name);
      expect(clientPlugin.description).toEqual(flashPlugin.description);
      expect(clientPlugin.version).toEqual(flashPlugin.version);

      // Ensure we don't pick up properties that are available but not
      // in the spec.
      expect(client.plugins['Shockwave Flash'].filename).toBeUndefined();
    });
  });

  describe('uuid', () => {
    it('returns a valid userID', () => {
      const UUID_ISH_REGEX = /^[a-f0-9-]{36}$/;
      const driver = new NormandyDriver();
      const uuid = driver.uuid();
      expect(uuid).toMatch(UUID_ISH_REGEX);
    });
  });

  describe('userId', () => {
    const originalLocalStorage = window.localStorage;

    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', {
        value: new MockStorage(),
        configurable: true,
        writable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        configurable: true,
        writable: true,
      });
    });

    it('should return the userId from localStorage', () => {
      spyOn(window.localStorage, 'getItem').and.returnValue(null);
      spyOn(window.localStorage, 'setItem');

      const driver = new NormandyDriver();
      const userId = driver.userId;

      expect(window.localStorage.getItem).toHaveBeenCalledWith('userId');
      expect(window.localStorage.setItem).toHaveBeenCalledWith('userId', userId);
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
    store = new LocalStorage('test-prefix', { skipDurability: false });
  });

  it('has an optional options argument', () => {
    expect(() => new LocalStorage('test-prefix')).not.toThrow();
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

  it('can disable durability checks', async () => {
    store = new LocalStorage('test-prefix', { skipDurability: true });
    window.localStorage.setItem(STORAGE_DURABILITY_KEY, 0);
    try {
      await store.getItem('value');
    } catch (err) {
      throw new Error('Expected getItem to not throw');
    }
  });

  it('has the expected key format', async () => {
    // other tests rely on this, so fail fast if something changes
    window.localStorage.setItem('test-prefix-key', '"value"');
    expect(await store.getItem('key')).toEqual('value');
  });

  it('returns null for values with improper json', async () => {
    window.localStorage.setItem('test-prefix-foo', '{"bad":');
    expect(await store.getItem('foo')).toEqual(null);
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
