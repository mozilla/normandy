/* global exports:true */
const {Cu} = require("chrome");
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
let eventEmitter;

exports["test it works"] = (assert, done) => {
  eventEmitter.on("foo", () => done());
  eventEmitter.emit("foo");
};

exports["test it fires events async"] = (assert, done) => {
  let flag = 0;
  eventEmitter.on("foo", () => {
    flag += 1;
    assert.equal(flag, 1, "event handler fired multiple times");
    done();
  });
  assert.equal(flag, 0, "event handler fired before event");
  eventEmitter.emit("foo");
  assert.equal(flag, 0, "event handler fired syncronously");
};

exports["test it can safely fire events with no listeners"] = () => {
  eventEmitter.emit("foo");
};

exports["test it passes arguments"] = (assert, done) => {
  eventEmitter.on("foo", arg => {
    assert.equal(arg, "it works", "argument was not passed to event handler");
    done();
  });
  eventEmitter.emit("foo", "it works");
};

exports["test it works with multiple listeners in order"] = (assert, done) => {
  let counter = 0;

  eventEmitter.on("foo", () => {
    counter += 1;
    assert.equal(counter, 1, "counter was not expected value");
  });

  eventEmitter.on("foo", () => {
    counter += 10;
    assert.equal(counter, 11, "counter was not expected value");
    done();
  });

  eventEmitter.emit("foo");
};

exports["test off() works"] = (assert, done) => {

  let count = 0;
  function cb1() {
    count += 1;
  }
  function cb2() {
    count += 10;
    eventEmitter.off("foo", cb2);
  }
  function allDone() {
    assert.equal(count, 12, "counter was not expected value");
    done();
  }

  eventEmitter.on("foo", cb1);
  eventEmitter.on("foo", cb2);
  eventEmitter.on("done", allDone);

  eventEmitter.emit("foo");
  eventEmitter.emit("foo");
  eventEmitter.emit("done");
};

exports["test once() works"] = (assert, done) => {
  let count = 0;
  function cb() {
    count += 1;
  }
  function allDone() {
    assert.equal(count, 1, "counter was not expected value");
    done();
  }

  eventEmitter.on("done", allDone);
  eventEmitter.once("foo", cb);

  eventEmitter.emit("foo");
  eventEmitter.emit("foo");
  eventEmitter.emit("done");
};

// Because of the way the event emitter iterates, this is a fragile case
exports["test off() during event handler works"] = (assert, done) => {
  let count = 0;
  function cb() {
    count += 1;
  }
  function allDone() {
    assert.equal(count, 2, "counter was not expected value");
    done();
  }

  eventEmitter.once("foo", cb);
  eventEmitter.on("foo", cb);
  eventEmitter.on("done", allDone);

  eventEmitter.emit("foo");
  eventEmitter.emit("done");
};

before(exports, () => {
  sandboxManager = new SandboxManager();
  sandboxManager.addHold("test running");
  let driver = new NormandyDriver(sandboxManager);
  let sandboxedDriver = Cu.cloneInto(driver, sandboxManager.sandbox, {cloneFunctions: true});
  eventEmitter = new sandboxManager.sandbox.EventEmitter(sandboxedDriver).wrappedJSObject;
});

after(exports, (testName, assert, done) => {
  sandboxManager.removeHold("test running");
  sandboxManager.assertNuked(assert, done);
});

testRunner.run(exports);
