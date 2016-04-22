const {Cu} = require('chrome');
Cu.import('resource://gre/modules/TelemetryController.jsm'); /* globals TelemetryController: false */

const {Jexl} = require('jexl');

function getEnv() {
  return {
    telemetry: TelemetryController.getCurrentPingData(true),
  };
}

const jexl = new Jexl();

exports.EnvExpressions = {
  eval(expr, extraContext={}) {
    const context = Object.assign({}, getEnv(), extraContext);
    return jexl.eval(expr, context);
  },
};
