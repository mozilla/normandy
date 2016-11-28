import uuid from 'node-uuid';

import { HeartbeatEmitter } from '../../selfrepair/normandy_driver.js';

export class MockStorage {
  constructor() {
    this.data = {};
  }

  getItem(key) {
    const value = this.data[key];
    return Promise.resolve(value !== undefined ? value : null);
  }

  setItem(key, value) {
    this.data[key] = String(value);
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
      return;
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
    saveHeartbeatFlow() {
      return Promise.resolve();
    },
  };

  const toSpy = [
    'location',
    'log',
    'createStorage',
    'showHeartbeat',
    'client',
    'uuid',
    'saveHeartbeatFlow',
  ];
  for (const method of toSpy) {
    spyOn(normandy, method).and.callThrough();
  }

  return normandy;
}
