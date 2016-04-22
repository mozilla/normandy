const testRunner = require('sdk/test');

const {EnvExpressions} = require('../lib/EnvExpressions.js');
const {promiseTest} = require('./utils.js');

exports['test it works'] = promiseTest(assert => {
  return EnvExpressions.eval('2+2')
  .then(val => assert.equal(val, 4));
});

exports['test it can access telemetry'] = promiseTest(assert => {
  return EnvExpressions.eval('telemetry != null')
  .then(val => assert.ok(val));
});

testRunner.run(exports);
