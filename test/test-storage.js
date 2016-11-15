/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {Cu} = require("chrome");
const testRunner = require("sdk/test");
const {before, after} = require("sdk/test/utils");

Cu.import("resource://shield-recipe-client/lib/Storage.jsm");
Cu.import("resource://shield-recipe-client/test/TestUtils.jsm");
const {promiseTest} = TestUtils;

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
  store = Storage.makeStorage("prefix", fakeSandbox);
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
