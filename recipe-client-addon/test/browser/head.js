const {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("resource://shield-recipe-client/lib/SandboxManager.jsm", this);
Cu.import("resource://shield-recipe-client/lib/NormandyDriver.jsm", this);

// Load mocking/stubbing library, sinon
// docs: http://sinonjs.org/docs/
const loader = Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);
loader.loadSubScript("resource://testing-common/sinon-1.16.1.js");

registerCleanupFunction(async function() {
  // Cleanup window or the test runner will throw an error
  delete window.sinon;
  delete window.setImmediate;
  delete window.clearImmediate;
});


this.UUID_REGEX = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/;

this.withSandboxManager = function(Assert, testFunction) {
  return async function inner() {
    const sandboxManager = new SandboxManager();
    sandboxManager.addHold("test running");

    await testFunction(sandboxManager);

    sandboxManager.removeHold("test running");
    await sandboxManager.isNuked()
      .then(() => Assert.ok(true, "sandbox is nuked"))
      .catch(e => Assert.ok(false, "sandbox is nuked", e));
  };
};

this.withDriver = function(Assert, testFunction) {
  return withSandboxManager(Assert, async function inner(sandboxManager) {
    const driver = new NormandyDriver(sandboxManager);
    await testFunction(driver);
  });
};
