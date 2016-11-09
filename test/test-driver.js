const testRunner = require("sdk/test");
const {before, after} = require("sdk/test/utils");

const {NormandyDriver} = require("../lib/NormandyDriver.js");
const {SandboxManager} = require("../lib/SandboxManager.js");

let sandboxManager;
let driver;

exports["test uuid format"] = assert => {
  let uuid = driver.uuid();
  assert.ok(/^[a-f0-9-]{36}$/.test(uuid), "invalid uuid format");
};

exports["test uuid is unique"] = assert => {
  let uuid1 = driver.uuid();
  let uuid2 = driver.uuid();
  assert.notEqual(uuid1, uuid2, "uuids are unique");
};

before(exports, () => {
  sandboxManager = new SandboxManager();
  sandboxManager.addHold("test running");
  driver = new NormandyDriver(sandboxManager);
});

after(exports, (testName, assert, done) => {
  driver = null;
  sandboxManager.removeHold("test running");
  sandboxManager.assertNuked(assert, done);
});

testRunner.run(exports);
