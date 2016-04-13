const {uuid} = require('sdk/util/uuid');
const {Cu} = require('chrome');
Cu.import('resource://gre/modules/Services.jsm'); /* globals Services: false */
Cu.import('resource://gre/modules/Preferences.jsm'); /* globals Preferences */
Cu.import('resource:///modules/ShellService.jsm'); /* globals ShellService: false */
Cu.import('resource:///modules/UITour.jsm'); /* globals UITour */

const {Log} = require('./Log.js');
const {Storage} = require('./Storage.js');

const actionLogger = Log.makeNamespace('actionLogger');

// Spec: https://raw.githubusercontent.com/mozilla/normandy-actions/9d6406f21f9025602c87754209de9fd675cc4871/docs/driver.rst
exports.NormandyDriver = function(sandbox, country) {
  return {
    testing: true,

    get locale() {
      return Preferences.get('general.useragent.locale');
    },

    log(message, level='debug') {
      let levels = ['debug', 'info', 'warn', 'error'];
      if (levels.indexOf(level) === -1) {
        throw new Error(`Invalid log level "${level}"`);
      }
      actionLogger[level](message);
    },

    showHeartbeat(options) {
      // https://dxr.mozilla.org/mozilla-central/source/browser/components/uitour/UITour.jsm#1096
      const log = Log.makeNamespace('NormandyDriver.showHeartbeat');
      log.info('showing heartbeat');
      let aWindow = Services.wm.getMostRecentWindow('navigator:browser');
      UITour.showHeartbeat(aWindow, {
        message: options.message,
        thankyouMessage: options.thanksMessage,
        flowId: options.flowId,
        learnMoreMessage: options.learnMoreMessage,
        learnMoreUrl: options.learnMoreUrl,
        testing: this.testing,
      });
      return sandbox.Promise.resolve();

    },

    saveHeartbeatFlow() {
      return sandbox.Promise.reject(new Error('Not implemented'));
    },

    client() {
      let appinfo = {
        version: Services.appinfo.version,
        channel: Services.appinfo.defaultUpdateChannel,
        isDefaultBrowser: ShellService.isDefaultBrowser() || null,
        searchEngine: Services.search.defaultEngine.identifier,
        syncSetup: Services.prefs.prefHasUserValue('services.sync.username'),
      };

      return sandbox.Promise.resolve(appinfo);
    },

    uuid() {
      return uuid().toString();
    },

    createStorage(keyPrefix) {
      const log = Log.makeNamespace('NormandyDriver.createStorage');
      let storage;
      try {
        storage = new Storage(keyPrefix, sandbox);
      } catch(e) {
        log.error(e.stack);
        throw e;
      }
      return storage;
    },

    location() {
      let location = Cu.cloneInto({countryCode: country}, sandbox);
      return sandbox.Promise.resolve(location);
    },
  };
};
