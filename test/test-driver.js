const testRunner = require("sdk/test");
const {before, after} = require("sdk/test/utils");

const {NormandyDriver} = require("../lib/NormandyDriver.js");
const {SandboxManager} = require("../lib/SandboxManager.js");

let sandboxManager;
let driver;

exports["test uuid"] = assert => {
  let uuid = driver.uuid();
  assert.notEqual(/^[a-f0-9-]{36}$/.exec(uuid), null);
};

before(exports, () => {
  sandboxManager = new SandboxManager();
  sandboxManager.addHold("test running");
  driver = new NormandyDriver(sandboxManager);
});

after(exports, () => {
  driver = null;
  sandboxManager.removeHold("test running");
  sandboxManager.assertNuked();
});

testRunner.run(exports);
