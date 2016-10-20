const {Cu} = require("chrome");
Cu.import("resource://gre/modules/Timer.jsm"); /* globals setTimeout, clearTimeout */

const {EventEmitter} = require("./EventEmitter.js");

exports.makeSandbox = function() {
  const sandbox = new Cu.Sandbox(null, {
    wantComponents: false,
    wantGlobalProperties: ["URL", "URLSearchParams"],
  });

  function setTimeoutWrapper(cb, time) {
    if (typeof cb !== "function") {
      throw new sandbox.Error(`setTimeout must be called with a function, got "${typeof cb}"`);
    }
    const ret = setTimeout(() => cb(), time);
    return Cu.cloneInto(ret, sandbox);
  }

  function clearTimeoutWrapper(token) {
    clearTimeout(token);
  }

  sandbox.setTimeout = Cu.cloneInto(setTimeoutWrapper, sandbox, {cloneFunctions: true});
  sandbox.clearTimeout = Cu.cloneInto(clearTimeoutWrapper, sandbox, {cloneFunctions: true});
  sandbox.window = Cu.cloneInto({}, sandbox);

  Cu.evalInSandbox(`EventEmitter = ${EventEmitter.toString()}`, sandbox);

  return sandbox;
};
