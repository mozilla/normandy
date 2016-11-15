/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {Cu} = require("chrome");
const testRunner = require("sdk/test");
const {before, after} = require("sdk/test/utils");

Cu.import("resource://shield-recipe-client/lib/NormandyDriver.jsm");
Cu.import("resource://shield-recipe-client/lib/SandboxManager.jsm");

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
