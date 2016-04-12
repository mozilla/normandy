const {uuid} = require('sdk/util/uuid');
const {Cu} = require('chrome');
Cu.import('resource://gre/modules/Services.jsm'); /* globals Services: false */
Cu.import('resource://gre/modules/Preferences.jsm'); /* globals Preferences */
Cu.import('resource:///modules/ShellService.jsm'); /* globals ShellService: false */

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

    showHeartbeat(/* options */) {
      // TODO
      // https://dxr.mozilla.org/mozilla-central/source/browser/components/uitour/UITour.jsm#1096
      return Promise.reject(new Error('not implemented'));
    },

    getAppInfo() {
      Log.debug(JSON.stringify(Object.keys(Services.appinfo)));
      let appinfo = {
        defaultUpdateChannel: Services.appinfo.defaultUpdateChannel,
        version: Services.appinfo.version,
        isDefaultBrowser: ShellService.isDefaultBrowser() || null,
      };

      return Promise.resolve(appinfo);
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
