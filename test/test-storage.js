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

const {makeStorage} = extRequire("lib/Storage.js");
const {promiseTest} = extRequire("test/utils.js");

let store;

exports["test set and get"] = promiseTest(assert => {
  return store.setItem("key", "value")
    .then(() => store.getItem("key"))
    .then(value => {
      assert.equal(value, "value", "storage returned wrong value");
    });
});

exports["test value don't exist before set"] = promiseTest(assert => {
  return store.getItem("absent")
    .then(value => assert.equal(value, null), "storage returned non-null for missing key");
});

exports["test set and remove and get"] = promiseTest(assert => {
  return store.setItem("removed", "value")
    .then(() => store.removeItem("removed"))
    .then(() => store.getItem("removed"))
    .then(value => assert.equal(value, null, "removed value was not null"));
});

exports["test tests are independent 1 of 2"] = promiseTest(assert => {
  return store.getItem("counter")
    .then(value => store.setItem("counter", (value || 0) + 1))
    .then(() => store.getItem("counter"))
    .then(value => assert.equal(value, 1, "storage was not cleared between tests"));
});

exports["test tests are independent 2 of 2"] = promiseTest(assert => {
  return store.getItem("counter")
    .then(value => store.setItem("counter", (value || 0) + 1))
    .then(() => store.getItem("counter"))
    .then(value => assert.equal(value, 1, "storage was not cleared between tests"));
});

before(exports, () => {
  let fakeSandbox = {Promise};
  store = makeStorage("prefix", fakeSandbox);
});

after(exports, (name, assert, done) => {
  store.clear()
    .catch(err => {
      assert.ok(false, err);
    })
    .then(() => {
      done();
    });
});

testRunner.run(exports);
