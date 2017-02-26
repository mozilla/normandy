/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import("resource://gre/modules/Preferences.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/Task.jsm");
Cu.import("resource://gre/modules/TelemetryArchive.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://shield-recipe-client/lib/NormandyApi.jsm");

const {generateUUID} = Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator);

this.EXPORTED_SYMBOLS = ["ClientEnvironment"];

const prefs = Services.prefs.getBranch("extensions.shield-recipe-client.");

// Cached API request for client attributes that are determined by the Normandy
// service.
let _classifyRequest = null;
const getClientClassification = Task.async(function *() {
  if (!_classifyRequest) {
    _classifyRequest = NormandyApi.classifyClient();
  }
  return yield _classifyRequest;
});

this.ClientEnvironment = {
  /**
   * Test wrapper that mocks the server request for classifying the client.
   * @param  {Object}   data          Fake server data to use
   * @param  {Function} testGenerator Test generator to execute while mock data is in effect.
   */
  withMockClassify(data, testGenerator) {
    return function* inner() {
      const oldRequest = _classifyRequest;
      _classifyRequest = Promise.resolve(data);
      yield testGenerator();
      _classifyRequest = oldRequest;
    };
  },

  /**
   * Create an object that provides general information about the client application.
   *
   * RecipeRunner.jsm uses this as part of the context for filter expressions,
   * so avoid adding non-getter functions as attributes, as filter expressions
   * cannot execute functions.
   *
   * Also note that, because filter expressions implicitly resolve promises, you
   * can add getter functions that return promises for async data.
   * @return {Object}
   */
  getEnvironment() {
    const environment = {};

    XPCOMUtils.defineLazyGetter(environment, "userId", () => {
      let id = prefs.getCharPref("user_id");
      if (id === "") {
        // generateUUID adds leading and trailing "{" and "}". strip them off.
        id = generateUUID().toString().slice(1, -1);
        prefs.setCharPref("user_id", id);
      }
      return id;
    });

    XPCOMUtils.defineLazyGetter(environment, "country", () => {
      return getClientClassification().then(classification => classification.country);
    });

    XPCOMUtils.defineLazyGetter(environment, "request_time", () => {
      return getClientClassification().then(classification => classification.request_time);
    });

    XPCOMUtils.defineLazyGetter(environment, "distribution", () => {
      return Preferences.get("distribution.id", "default");
    });

    XPCOMUtils.defineLazyGetter(environment, "telemetry", () => {
      return Task.spawn(function *() {
        const pings = yield TelemetryArchive.promiseArchivedPingList();

        // get most recent ping per type
        const mostRecentPings = {};
        for (const ping of pings) {
          if (ping.type in mostRecentPings) {
            if (mostRecentPings[ping.type].timeStampCreated < ping.timeStampCreated) {
              mostRecentPings[ping.type] = ping;
            }
          } else {
            mostRecentPings[ping.type] = ping;
          }
        }

        const telemetry = {};
        for (const key in mostRecentPings) {
          const ping = mostRecentPings[key];
          telemetry[ping.type] = yield TelemetryArchive.promiseArchivedPingById(ping.id);
        }
        return telemetry;
      });
    });

    return environment;
  },
};
