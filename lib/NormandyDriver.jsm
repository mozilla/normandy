/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";
/* globals Components */

const {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource:///modules/ShellService.jsm");
Cu.import("resource://gre/modules/AddonManager.jsm");
Cu.import("resource://gre/modules/Timer.jsm"); /* globals setTimeout, clearTimeout */
Cu.import("resource://shield-recipe-client/lib/Log.jsm");
Cu.import("resource://shield-recipe-client/lib/Storage.jsm");
Cu.import("resource://shield-recipe-client/lib/Heartbeat.jsm");

const {generateUUID} = Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator);

this.EXPORTED_SYMBOLS = ["NormandyDriver"];

const PREF_INPUT_HOST = "extensions.shield-recipe-client@mozilla.org.input_host";
const actionLogger = Log.makeNamespace("actions");

this.NormandyDriver = function(sandboxManager, extraContext={}) {
  if (!sandboxManager) {
    throw new Error("sandboxManager is required");
  }
  const {sandbox} = sandboxManager;

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

      const sandboxedDriver = Cu.cloneInto(this, sandbox, {cloneFunctions: true});
      const ee = new sandbox.EventEmitter(sandboxedDriver).wrappedJSObject;
      const internalOptions = Object.assign({}, options, {testing: this.testing});
      new Heartbeat(aWindow, ee, sandboxManager, internalOptions);
      return sandbox.Promise.resolve(ee);
    },

    saveHeartbeatFlow(data) {
      let defaultURL;
      if (!this.testing) {
        defaultURL = "https://input.mozilla.org/api/v2/hb/";
      } else {
        defaultURL = "https://input.allizom.org/api/v2/hb/";
      }
      const url = Services.prefs.getStringPref(PREF_INPUT_HOST, defaultURL);

      let headers = {Accept: "application/json"};

      Log.debug("Sending heartbeat flow data to Input", data);

      // Make request to input
      let p = fetch(url, {body: JSON.stringify(data), headers})
        .then(response => response.text())
        .then(responseText => {
          Log.log("Input response:", responseText);
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
      const appinfo = {
        version: Services.appinfo.version,
        channel: Services.appinfo.defaultUpdateChannel,
        isDefaultBrowser: ShellService.isDefaultBrowser() || null,
        searchEngine: null,
        syncSetup: Services.prefs.prefHasUserValue("services.sync.username"),
        plugins: {},
        doNotTrack: Services.prefs.getBoolPref("privacy.donottrackheader.enabled"),
      };

      const searchEnginePromise = new Promise(resolve => {
        Services.search.init(rv => {
          if (Components.isSuccessCode(rv)) {
            appinfo.searchEngine = Services.search.defaultEngine.identifier;
          }
          resolve();
        });
      });

      const pluginsPromise = new Promise(resolve => {
        AddonManager.getAddonsByTypes(["plugin"], plugins => {
          plugins.forEach(plugin => appinfo.plugins[plugin.name] = plugin);
          resolve();
        });
      });

      return new sandbox.Promise(resolve => {
        Promise.all([searchEnginePromise, pluginsPromise]).then(() => {
          resolve(Cu.cloneInto(appinfo, sandbox));
        });
      });
    },

    uuid() {
      let ret = generateUUID().toString();
      ret = ret.slice(1, ret.length - 1);
      return ret;
    },

    createStorage(keyPrefix) {
      let storage;
      try {
        storage = Storage.makeStorage(keyPrefix, sandbox);
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

    setTimeout(cb, time) {
      if (typeof cb !== "function") {
        throw new sandbox.Error(`setTimeout must be called with a function, got "${typeof cb}"`);
      }
      const token = setTimeout(() => {
        cb();
        sandboxManager.removeHold(`setTimeout-${token}`);
      }, time);
      sandboxManager.addHold(`setTimeout-${token}`);
      return Cu.cloneInto(token, sandbox);
    },

    clearTimeout(token) {
      clearTimeout(token);
      sandboxManager.removeHold(`setTimeout-${token}`);
    },
  };
};
