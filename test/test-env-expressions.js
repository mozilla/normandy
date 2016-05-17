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

exports['test has a date transform'] = promiseTest(assert => {
  return EnvExpressions.eval('"2016-04-22"|date')
  .then(val => {
    const d = new Date(Date.UTC(2016, 3, 22)); // months are 0 based
    assert.equal(val.toString(), d.toString());
  });
});

exports['test dates are comparable'] = promiseTest(assert => {
  let context = {someTime: new Date(2016, 0, 1)};

  return Promise.all([
    EnvExpressions.eval('"2015-01-01"|date < someTime', context)
      .then(val => assert.ok(val)),
    EnvExpressions.eval('"2017-01-01"|date > someTime', context)
      .then(val => assert.ok(val)),
  ]);
});

testRunner.run(exports);
