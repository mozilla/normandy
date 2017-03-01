const {classes: Cc, interfaces: Ci, utils: Cu} = Components;

// Load mocking/stubbing library, sinon
// docs: http://sinonjs.org/docs/
const loader = Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);
loader.loadSubScript("resource://testing-common/sinon-1.16.1.js");

registerCleanupFunction(function*() {
  // Cleanup window or the test runner will throw an error
  delete window.sinon;
  delete window.setImmediate;
  delete window.clearImmediate;
});
