const {Cu} = require("chrome");
Cu.import("resource://gre/modules/TelemetryController.jsm"); /* globals TelemetryController: false */
Cu.import("resource://gre/modules/Task.jsm"); /* globals Task */
const testRunner = require("sdk/test");

const {EnvExpressions} = require("../lib/EnvExpressions.js");
const {promiseTest} = require("./utils.js");

exports["test it works"] = promiseTest(assert => {
  return EnvExpressions.eval("2+2")
  .then(val => assert.equal(val, 4));
});

exports["test it evaluate multiline expressions"] = promiseTest(assert => {
  return EnvExpressions.eval(`
    2
    +
    2
  `)
  .then(val => assert.equal(val, 4));
});

exports["test it can access telemetry"] = promiseTest(assert => {
  return EnvExpressions.eval("telemetry")
  .then(telemetry => assert.ok(typeof telemetry === "object"));
});

exports["test it reads different types of telemetry"] = promiseTest(Task.async(function* (assert) {
  yield TelemetryController.submitExternalPing("testfoo", {foo: 1});
  yield TelemetryController.submitExternalPing("testbar", {bar: 2});
  const result = yield(EnvExpressions.eval("telemetry"));
  assert.equal(result.testfoo.payload.foo, 1);
  assert.equal(result.testbar.payload.bar, 2);
}));

exports["test has a date transform"] = promiseTest(assert => {
  return EnvExpressions.eval('"2016-04-22"|date')
  .then(val => {
    const d = new Date(Date.UTC(2016, 3, 22)); // months are 0 based
    assert.equal(val.toString(), d.toString());
  });
});

exports["test dates are comparable"] = promiseTest(assert => {
  let context = {someTime: new Date(2016, 0, 1)};

  return Promise.all([
    EnvExpressions.eval('"2015-01-01"|date < someTime', context)
      .then(val => assert.ok(val)),
    EnvExpressions.eval('"2017-01-01"|date > someTime', context)
      .then(val => assert.ok(val)),
  ]);
});

exports["test has a stable sample transform"] = promiseTest(assert => {
  return EnvExpressions.eval('["test"]|stableSample(0.999)')
  .then(val => assert.ok(val));
});

exports["test returns true for matching samples"] = promiseTest(assert => {
  return EnvExpressions.eval('["test"]|stableSample(1)')
  .then(val => assert.equal(val, true));
});

exports["test returns false for matching samples"] = promiseTest(assert => {
  return EnvExpressions.eval('["test"]|stableSample(0)')
  .then(val => assert.equal(val, false));
});

testRunner.run(exports);
