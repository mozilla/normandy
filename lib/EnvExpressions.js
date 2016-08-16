const {Cu} = require('chrome');
Cu.import('resource://gre/modules/TelemetryArchive.jsm'); /* globals TelemetryArchive: false */
Cu.import('resource://gre/modules/Task.jsm'); /* globals Task */

const {Jexl} = require('jexl');
const {stableSample} = require('./stableSample.js');

function getEnv() {
  return {
    telemetry: getLatestTelemetry(),
  };
}

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
  for (let ping of Object.values(mostRecentPings)) {
    telemetry[ping.type] = yield TelemetryArchive.promiseArchivedPingById(ping.id);
  }
  return telemetry;
});

const jexl = new Jexl();
jexl.addTransforms({
  date: dateString => new Date(dateString),
  stableSample: stableSample,
});

exports.EnvExpressions = {
  eval(expr, extraContext={}) {
    const context = Object.assign({}, getEnv(), extraContext);
    const onelineExpr = expr.replace(/[\t\n\r]/g, ' ');
    return jexl.eval(onelineExpr, context);
  },
};
