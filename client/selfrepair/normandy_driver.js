import uuid from 'node-uuid';

import Mozilla from 'selfrepair/uitour';

export const STORAGE_DURABILITY_KEY = '_storageDurability';

/**
 * Storage class that uses window.localStorage as it's backing store.
 */
export class LocalStorage {
  /**
   * @param    {string} prefix Prefix to append to all incoming keys.
   */
  constructor(prefix, { skipDurability = false } = {}) {
    this.prefix = prefix;
    this.skipDurability = skipDurability;
  }

  async isDurable() {
    const durabilityStatus = localStorage.getItem(STORAGE_DURABILITY_KEY);
    return (parseInt(durabilityStatus, 10) >= 2);
  }

  _makeKey(key) {
    return `${this.prefix}-${key}`;
  }

  async getItem(key) {
    const storageIsDurable = await this.isDurable();
    if (!storageIsDurable && !this.skipDurability) {
      throw new Error('Storage durability unconfirmed');
    }
    const val = localStorage.getItem(this._makeKey(key));
    try {
      return JSON.parse(val);
    } catch (e) {
      return null;
    }
  }

  async setItem(key, value) {
    return localStorage.setItem(this._makeKey(key), JSON.stringify(value));
  }

  async removeItem(key) {
    return localStorage.removeItem(this._makeKey(key));
  }
}

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
  ]

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

/**
 * Implementation of the Normandy driver.
 */
export default class NormandyDriver {
  constructor(uitour = Mozilla.UITour) {
    this._uitour = uitour;
    this.setDurability();
  }

  setDurability() {
    let durability = parseInt(localStorage.getItem(STORAGE_DURABILITY_KEY), 10);
    if (isNaN(durability)) {
      durability = 0;
    }
    localStorage.setItem(STORAGE_DURABILITY_KEY, durability + 1);
  }

  _heartbeatCallbacks = {};
  registerCallbacks() {
    // Trigger heartbeat callbacks when the UITour tells us that Heartbeat
    // happened.
    this._uitour.observe((eventName, data) => {
      if (eventName.startsWith('Heartbeat:')) {
        const croppedEventName = eventName.slice(10); // Chop off "Heartbeat:"
        const callback = this._heartbeatCallbacks[data.flowId];
        if (callback !== undefined) {
          callback(croppedEventName, data);
        }
      }
    });
  }

  locale = document.documentElement.dataset.locale || navigator.language;

  _testingOverride = false;
  get testing() {
    return this._testingOverride || new URL(window.location.href).searchParams.has('testing');
  }
  set testing(value) {
    this._testingOverride = value;
  }

  _location = { countryCode: null };
  location() {
    return Promise.resolve(this._location);
  }

  log(message, level = 'debug') {
    if (level === 'debug' && !this.testing) {
      return;
    } else if (level === 'error') {
      console.error(message);
    } else {
      console.log(message);
    }
  }

  /**
   * Generate a fresh UUID
   * @return {String} Generated UUID
   */
  uuid() {
    return uuid.v4();
  }

  /**
   * Get a user id. If one doesn't exist yet, make one up and store it in local storage.
   * @return {String} A stored or generated UUID
   */
  get userId() {
    let userId = localStorage.getItem('userId');
    if (userId === null) {
      userId = uuid.v4();
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  createStorage(prefix) {
    return new LocalStorage(prefix);
  }

  client() {
    return new Promise(resolve => {
      const client = {
        plugins: {},
      };

      // Populate plugin info.
      for (const plugin of navigator.plugins) {
        client.plugins[plugin.name] = {
          name: plugin.name,
          filename: plugin.filename,
          description: plugin.description,
          version: plugin.version,
        };
      }

      // Keys are UITour configs, functions are given the data
      // returned by UITour for that config.
      const wantedConfigs = {
        appinfo(data) {
          client.version = data.version;
          client.channel = data.defaultUpdateChannel;
          client.isDefaultBrowser = data.defaultBrowser;
          client.distribution = data.distribution;
        },
        selectedSearchEngine(data) {
          client.searchEngine = data.searchEngineIdentifier;
        },
        sync(data) {
          client.syncSetup = data.setup;
          client.syncDesktopDevices = data.desktopDevices || 0;
          client.syncMobileDevices = data.mobileDevices || 0;
          client.syncTotalDevices = data.totalDevices || 0;
        },
      };

      let retrievedConfigs = 0;
      const wantedConfigNames = Object.keys(wantedConfigs);
      wantedConfigNames.forEach(configName => {
        this._uitour.getConfiguration(configName, data => {
          wantedConfigs[configName](data);
          retrievedConfigs++;
          if (retrievedConfigs >= wantedConfigNames.length) {
            resolve(client);
          }
        });
      });
    });
  }

  showHeartbeat(options) {
    return new Promise(resolve => {
      const emitter = new HeartbeatEmitter();
      this._heartbeatCallbacks[options.flowId] = (eventName, data) => emitter.emit(eventName, data);

      // Positional arguments are overridden by the final options
      // argument, but they're still required so we pass them anyway.
      this._uitour.showHeartbeat(
        options.message,
        options.thanksMessage,
        options.flowId,
        options.postAnswerUrl,
        options.learnMoreMessage,
        options.learnMoreUrl,
        {
          engagementButtonLabel: options.engagementButtonLabel,
          surveyId: options.surveyId,
          surveyVersion: options.surveyVersion,
          testing: options.testing,
        }
      );

      resolve(emitter);
    });
  }
}
