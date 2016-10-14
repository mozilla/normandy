/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {uuid} = require('sdk/util/uuid');
const {Cu} = require('chrome');
Cu.import('resource://gre/modules/Services.jsm'); /* globals Services: false */
Cu.import('resource://gre/modules/Preferences.jsm'); /* globals Preferences */
Cu.import('resource:///modules/ShellService.jsm'); /* globals ShellService: false */

const {Log} = require('./Log.js');
const {Storage} = require('./Storage.js');
const {EnvExpressions} = require('./EnvExpressions.js');
const {Http} = require('./Http.js');
const {Heartbeat} = require('./Heartbeat.js');

const actionLogger = Log.makeNamespace('actions');

// Spec: https://raw.githubusercontent.com/mozilla/normandy-actions/9d6406f21f9025602c87754209de9fd675cc4871/docs/driver.rst
exports.NormandyDriver = function(recipeRunner, sandbox, extraContext) {
  return {
    testing: false,

    get locale() {
      return Cc["@mozilla.org/chrome/chrome-registry;1"]
        .getService(Ci.nsIXULChromeRegistry)
        .getSelectedLocale("browser");
    },

    log(message, level='debug') {
      let levels = ['debug', 'info', 'warn', 'error'];
      if (levels.indexOf(level) === -1) {
        throw new Error(`Invalid log level "${level}"`);
      }
      actionLogger[level](message);
    },

    showHeartbeat(options) {
      Log.info(`Showing heartbeat prompt "${options.message}"`);
      let aWindow = Services.wm.getMostRecentWindow('navigator:browser');

      if (!aWindow) {
        return sandbox.Promise.reject(new sandbox.Error('No window to show heartbeat in'));
      }

      let internalOptions = Object.assign({}, options, {testing: this.testing, sandbox});
      let heartbeat = new Heartbeat(aWindow, internalOptions);
      recipeRunner.heartbeatNotifications.push(heartbeat);
      let sandboxedEvents = Cu.cloneInto(heartbeat.events, sandbox, {cloneFunctions: true});
      return sandbox.Promise.resolve(sandboxedEvents);
    },

    saveHeartbeatFlow(data) {
      let defaultURL;
      if (!this.testing) {
        defaultURL = 'https://input.mozilla.org/api/v2/hb/';
      } else {
        defaultURL = 'https://input.allizom.org/api/v2/hb/';
      }
      const url = prefs.input_host || defaultURL;

      let headers = {Accept: 'application/json'};

      Log.debug('Sending heartbeat flow data to Input', data);

      // Make request to input
      let p = Http.post({url, data, headers})
        .then(response => {
          Log.log('Input response:', response.text);
          // Resolve undefined instead of passing the response down.
          return undefined;
        })
        .catch(error => {
          Log.error('Input response:', error);
          throw new sandbox.Error(error.toString());
        });
      // Wrap the promise for the sandbox
      return sandbox.Promise.resolve(p);
    },

    client() {
      let appinfo = {
        version: Services.appinfo.version,
        channel: Services.appinfo.defaultUpdateChannel,
        isDefaultBrowser: ShellService.isDefaultBrowser() || null,
        searchEngine: Services.search.defaultEngine.identifier,
        syncSetup: Services.prefs.prefHasUserValue('services.sync.username'),
        plugins: {}, // TODO
        doNotTrack: Services.prefs.getBoolPref('privacy.donottrackheader.enabled'),
      };
      appinfo = Cu.cloneInto(appinfo, sandbox);

      return sandbox.Promise.resolve(appinfo);
    },

    uuid() {
      let ret = uuid().toString();
      ret = ret.slice(1, ret.length - 1);
      return ret;
    },

    createStorage(keyPrefix) {
      let storage;
      try {
        storage = new Storage(keyPrefix, sandbox);
      } catch (e) {
        Log.error(e.stack);
        throw e;
      }
      return storage;
    },

    location() {
      let location = Cu.cloneInto({countryCode: extraContext.country}, sandbox);
      return sandbox.Promise.resolve(location);
    },
  };
};
