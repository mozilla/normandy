import EventEmitter from 'wolfy87-eventemitter';
import uuid from 'node-uuid';

import Mozilla from './uitour.js';

const STORAGE_DURABILITY_KEY = '_storageDurability';

/**
 * Storage class that uses window.localStorage as it's backing store.
 */
class LocalStorage {
  /**
   * @param    {string} prefix Prefix to append to all incoming keys.
   */
  constructor(prefix) {
    this.prefix = prefix;
    this._setDurabilityStatus();
  }

  async isDurable() {
    const durabilityStatus = localStorage.getItem(STORAGE_DURABILITY_KEY);
    return (parseInt(durabilityStatus, 10) >= 2);
  }

  _makeKey(key) {
    return `${this.prefix}-${key}`;
  }

  async getItem(key) {
    const storageIsDurable = await this.storage.isDurable();
    if (!storageIsDurable && !this.normandy.testing) {
      throw new Error('Storage durability unconfirmed');
    }
    return localStorage.getItem(this._makeKey(key));
  }

  async setItem(key, value) {
    return localStorage.setItem(this._makeKey(key), value);
  }

  async removeItem(key) {
    return localStorage.removeItem(this._makeKey(key));
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

  _heartbeatCallbacks = [];
  registerCallbacks() {
    // Trigger heartbeat callbacks when the UITour tells us that Heartbeat
    // happened.
    this._uitour.observe((eventName, data) => {
      if (eventName.startsWith('Heartbeat:')) {
        const flowId = data.flowId;
        const croppedEventName = eventName.slice(10); // Chop off "Heartbeat:"
        if (flowId in this._heartbeatCallbacks) {
          this._heartbeatCallbacks[flowId](croppedEventName, data);
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

  uuid() {
    return uuid.v4();
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

  saveHeartbeatFlow(data) {
    if (this.testing) {
      this.log('Pretending to send flow to Input');
      this.log(data);
      return Promise.resolve();
    }
    return fetch('https://input.mozilla.org/api/v2/hb/', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  heartbeatCallbacks = [];
  showHeartbeat(options) {
    return new Promise(resolve => {
      const emitter = new EventEmitter();
      this.heartbeatCallbacks[options.flowId] = (eventName, data) => emitter.emit(eventName, data);

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

  showStudyConsentPage(options) {
    this.log(JSON.stringify(options), 'debug');
  }
}
