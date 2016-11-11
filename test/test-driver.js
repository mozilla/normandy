const testRunner = require("sdk/test");
const {before, after} = require("sdk/test/utils");

const {Loader, Require} = require("toolkit/loader");
const loader = new Loader({
  paths: {
    "": "resource://gre/modules/commonjs/",
    lib: "resource://shield-recipe-client-at-mozilla-dot-org/lib",
    test: "resource://shield-recipe-client-at-mozilla-dot-org/test",
  },
});
const extRequire = new Require(loader, module);

const {NormandyDriver} = extRequire("lib/NormandyDriver.js");
const {SandboxManager} = extRequire("lib/SandboxManager.js");

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
