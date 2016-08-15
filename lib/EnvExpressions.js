const {Cu} = require('chrome');
Cu.import('resource://gre/modules/TelemetryController.jsm'); /* globals TelemetryController: false */

const {Jexl} = require('jexl');
const {stableSample} = require('./stableSample.js');

function getEnv() {
  return {
    telemetry: TelemetryController.getCurrentPingData(true),
  };
}

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
