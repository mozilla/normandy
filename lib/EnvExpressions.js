/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {Cu} = require("chrome");
Cu.import("resource://gre/modules/TelemetryArchive.jsm");
Cu.import("resource://gre/modules/Task.jsm");

const {Jexl} = require("../node_modules/jexl/lib/Jexl.js");

const {stableSample} = require("./stableSample.js");

const getLatestTelemetry = Task.async(function *() {
  let pings = yield TelemetryArchive.promiseArchivedPingList();

  // get most recent ping per type
  let mostRecentPings = {};
  for (let ping of pings) {
    if (ping.type in mostRecentPings) {
      if (mostRecentPings[ping.type].timeStampCreated < ping.timeStampCreated) {
        mostRecentPings[ping.type] = ping;
      }
    } else {
      mostRecentPings[ping.type] = ping;
    }
  }

  let telemetry = {};
  for (let key in mostRecentPings) {
    const ping = mostRecentPings[key];
    telemetry[ping.type] = yield TelemetryArchive.promiseArchivedPingById(ping.id);
  }
  return telemetry;
});

const jexl = new Jexl();
jexl.addTransforms({
  date: dateString => new Date(dateString),
  stableSample,
});

exports.EnvExpressions = {
  eval(expr, extraContext={}) {
    const context = Object.assign({telemetry: getLatestTelemetry()}, extraContext);
    const onelineExpr = expr.replace(/[\t\n\r]/g, " ");
    return jexl.eval(onelineExpr, context);
  },
};
