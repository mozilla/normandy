/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {uuid} = require("sdk/util/uuid");
const {components, Cu, Cc, Ci} = require("chrome");
const {prefs} = require("sdk/simple-prefs");
Cu.import("resource://gre/modules/Services.jsm"); /* globals Services */
Cu.import("resource:///modules/ShellService.jsm"); /* globals ShellService */
Cu.import("resource://gre/modules/AddonManager.jsm"); /* globals AddonManager */

const {Log} = require("./Log.js");
const {Storage} = require("./Storage.js");
const {Http} = require("./Http.js");
const {Heartbeat} = require("./Heartbeat.js");

const actionLogger = Log.makeNamespace("actions");

exports.NormandyDriver = function(recipeRunner, sandbox, extraContext) {
  return {
    testing: false,

    get locale() {
      return Cc["@mozilla.org/chrome/chrome-registry;1"]
        .getService(Ci.nsIXULChromeRegistry)
        .getSelectedLocale("browser");
    },

    log(message, level="debug") {
      let levels = ["debug", "info", "warn", "error"];
      if (levels.indexOf(level) === -1) {
        throw new Error(`Invalid log level "${level}"`);
      }
      actionLogger[level](message);
    },

    showHeartbeat(options) {
      Log.info(`Showing heartbeat prompt "${options.message}"`);
      let aWindow = Services.wm.getMostRecentWindow("navigator:browser");

      if (!aWindow) {
        return sandbox.Promise.reject(new sandbox.Error("No window to show heartbeat in"));
      }

      const ee = new sandbox.EventEmitter(Cu.cloneInto(this, sandbox, {cloneFunctions: true}));
      const internalOptions = Object.assign({}, options, {testing: this.testing, sandbox});
      const heartbeat = new Heartbeat(aWindow, ee, internalOptions);
      recipeRunner.heartbeatNotifications.push(heartbeat);
      return sandbox.Promise.resolve(ee);
    },

    saveHeartbeatFlow(data) {
      let defaultURL;
      if (!this.testing) {
        defaultURL = "https://input.mozilla.org/api/v2/hb/";
      } else {
        defaultURL = "https://input.allizom.org/api/v2/hb/";
      }
      const url = prefs.input_host || defaultURL;

      let headers = {Accept: "application/json"};

      Log.debug("Sending heartbeat flow data to Input", data);

      // Make request to input
      let p = Http.post({url, data, headers})
        .then(response => {
          Log.log("Input response:", response.text);
          // Resolve undefined instead of passing the response down.
          return undefined;
        })
        .catch(error => {
          if (error.response) {
            Log.error("Input error response:", error.response.json);
          } else {
            Log.error("Error sending heartbeat flow data to Input:", error);
          }
          throw new sandbox.Error(error.toString());
        });
      // Wrap the promise for the sandbox
      return sandbox.Promise.resolve(p);
    },

    client() {
      const appInfo = {
        version: Services.appInfo.version,
        channel: Services.appInfo.defaultUpdateChannel,
        isDefaultBrowser: ShellService.isDefaultBrowser() || null,
        searchEngine: null,
        syncSetup: Services.prefs.prefHasUserValue("services.sync.username"),
        plugins: {},
        doNotTrack: Services.prefs.getBoolPref("privacy.donottrackheader.enabled"),
      };

      return new sandbox.Promise(
        // Get default search engine
        resolve => {
          Services.search.init(rv => {
            if (components.isSuccessCode(rv)) {
              appInfo.searchEngine = Services.search.defaultEngine.identifier;
            }
            resolve();
          });
        })
        // get list of plugins
        .then(() => new Promise(resolve => {
          AddonManager.getAddonsByTypes(["plugin"], plugins => {
            plugins.forEach(plugin => appInfo.plugins[plugin.name] = plugin);
            resolve();
          });
        }))
        // return the built appInfo.
        .then(() => {
          return Cu.cloneInto(appInfo, sandbox);
        });
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
