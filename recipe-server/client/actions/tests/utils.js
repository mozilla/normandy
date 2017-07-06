import uuid from 'node-uuid';

/**
 * EventEmitter for Heartbeat events. Unlike normal event emitters,
 * Heartbeat events only occur once, and we guarantee that if a handler
 * is registered _after_ an event occurs, it will still be executed.
 */
export class HeartbeatEmitter {
  static EVENTS = [
    'NotificationOffered',
    'NotificationClosed',
    'LearnMore',
    'Voted',
    'TelemetrySent',
    'Engaged',
  ];

  constructor() {
    this.callbacks = {};
    this.eventData = {};
    for (const event of HeartbeatEmitter.EVENTS) {
      this.callbacks[event] = [];
      this.eventData[event] = null;
    }
  }

  on(eventName, callback) {
    if (HeartbeatEmitter.EVENTS.indexOf(eventName) === -1) {
      throw new Error(`${eventName} is an invalid Heartbeat event type.`);
    }

    this.callbacks[eventName].push(callback);

    // Call the callback if the event already happened.
    const data = this.eventData[eventName];
    if (data !== null) {
      callback(data);
    }
  }

  emit(eventName, data) {
    if (this.eventData[eventName] !== null) {
      throw new Error(`Cannot emit a Heartbeat event more than once: ${eventName}`);
    }

    this.eventData[eventName] = data;
    for (const callback of this.callbacks[eventName]) {
      callback(data);
    }
  }
}

export class MockStorage {
  constructor() {
    this.data = {};
  }

  getItem(key) {
    const value = this.data[key];
    return Promise.resolve(value !== undefined ? value : null);
  }

  setItem(key, value) {
    this.data[key] = value;
    return Promise.resolve();
  }

  removeItem(key) {
    delete this.data[key];
    return Promise.resolve();
  }
}

export function mockNormandy() {
  const normandy = {
    mock: {
      storage: new MockStorage(),
      heartbeatEmitter: new HeartbeatEmitter(),
      location: {
        countryCode: 'us',
      },
      client: {
        version: '41.0.1',
        channel: 'release',
        isDefaultBrowser: true,
        searchEngine: 'google',
        syncSetup: true,
        plugins: {},
      },
    },

    testing: false,
    locale: 'en-US',
    location() {
      return Promise.resolve(this.mock.location);
    },
    log() {

    },
    createStorage() {
      return this.mock.storage;
    },
    showHeartbeat() {
      return Promise.resolve(this.mock.heartbeatEmitter);
    },
    client() {
      return Promise.resolve(this.mock.client);
    },
    uuid() {
      return 'fake-uuid';
    },
    // this needs to be a valid UUID4 to pass regex tests later
    userId: uuid(),
  };

  const toSpy = [
    'location',
    'log',
    'createStorage',
    'showHeartbeat',
    'client',
    'uuid',
  ];
  for (const method of toSpy) {
    spyOn(normandy, method).and.callThrough();
  }

  return normandy;
}
