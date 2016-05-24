const {Cu} = require('chrome');
const testRunner = require('sdk/test');
const {before, after} = require('sdk/test/utils');

const {NormandyDriver} = require('../lib/NormandyDriver.js');

let sandbox;
let driver;

exports['test uuid'] = assert => {
  let uuid = driver.uuid();
  assert.notEqual(/^[a-f0-9-]{36}$/.exec(uuid), null);
};

before(exports, () => {
  sandbox = new Cu.Sandbox(null);
  driver = new NormandyDriver(sandbox, {});
});

after(exports, () => {
  driver = null;
  Cu.nukeSandbox(sandbox);
});

testRunner.run(exports);
