import Mozilla from './uitour.js';
import EventEmitter from 'wolfy87-eventemitter';
import uuid from 'node-uuid';

/**
 * Storage class that uses window.localStorage as it's backing store.
 * @param {string} prefix Prefix to append to all incoming keys.
 */
function LocalStorage(prefix) {
  this.prefix = prefix;
}

Object.assign(LocalStorage.prototype, {
  _makeKey(key) {
    return `${this.prefix}-${key}`;
  },

  getItem(key) {
    return new Promise(resolve => {
      resolve(localStorage.getItem(this._makeKey(key)));
    });
  },

  setItem(key, value) {
    return new Promise(resolve => {
      localStorage.setItem(this._makeKey(key), value);
      resolve();
    });
  },

  removeItem(key) {
    return new Promise(resolve => {
      localStorage.removeItem(this._makeKey(key));
      resolve();
    });
  },
});


/**
 * Implementation of the Normandy driver.
 */
const Normandy = {
  locale: document.documentElement.dataset.locale || navigator.language,

  _testingOverride: false,
  get testing() {
    return this._testingOverride || new URL(window.location.href).searchParams.has('testing');
  },
  set testing(value) {
    this._testingOverride = value;
  },

  _location: { countryCode: null },
  location() {
    return Promise.resolve(this._location);
  },

  log(message, level = 'debug') {
    if (level === 'debug' && !this.testing) {
      return;
    } else if (level === 'error') {
      console.error(message);
    } else {
      console.log(message);
    }
  },

  uuid() {
    return uuid.v4();
  },

  createStorage(prefix) {
    return new LocalStorage(prefix);
  },

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
        Mozilla.UITour.getConfiguration(configName, data => {
          wantedConfigs[configName](data);
          retrievedConfigs++;
          if (retrievedConfigs >= wantedConfigNames.length) {
            resolve(client);
          }
        });
      });
    });
  },

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
  },

  heartbeatCallbacks: [],
  showHeartbeat(options) {
    return new Promise(resolve => {
      const emitter = new EventEmitter();
      this.heartbeatCallbacks[options.flowId] = (eventName, data) => emitter.emit(eventName, data);

            // Positional arguments are overridden by the final options
            // argument, but they're still required so we pass them anyway.
      Mozilla.UITour.showHeartbeat(
                options.message,
                options.thanksMessage,
                options.flowId,
                options.postAnswerUrl,
                options.learnMoreMessage,
                options.learnMoreUrl,
        {
          surveyId: options.surveyId,
          surveyVersion: options.surveyVersion,
          testing: options.testing,
        }
            );

      resolve(emitter);
    });
  },
};


// Trigger heartbeat callbacks when the UITour tells us that Heartbeat
// happened.
Mozilla.UITour.observe((eventName, data) => {
  if (eventName.startsWith('Heartbeat:')) {
    const flowId = data.flowId;
    const croppedEventName = eventName.slice(10); // Chop off "Heartbeat:"
    if (flowId in Normandy.heartbeatCallbacks) {
      Normandy.heartbeatCallbacks[flowId](croppedEventName, data);
    }
  }
});

export default Normandy;
