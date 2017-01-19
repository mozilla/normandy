"use strict";
// Cu is defined in xpc_head.js
/* globals Cu */

Cu.import("resource://gre/modules/TelemetryController.jsm", this);
Cu.import("resource://gre/modules/Task.jsm", this);

Cu.import("resource://shield-recipe-client/lib/EnvExpressions.jsm", this);
Cu.import("resource://gre/modules/Log.jsm", this);

add_task(function* () {
  // setup
  yield TelemetryController.submitExternalPing("testfoo", {foo: 1});
  yield TelemetryController.submitExternalPing("testbar", {bar: 2});

  let val;
  // Test that basic expressions work
  val = yield EnvExpressions.eval("2+2");
  equal(val, 4, "basic expression works");

  // Test that multiline expressions work
  val = yield EnvExpressions.eval(`
    2
    +
    2
  `);
  equal(val, 4, "multiline expression works");

  // Test it can access telemetry
  val = yield EnvExpressions.eval("telemetry");
  equal(typeof val, "object", "Telemetry is accesible");

  // Test it reads different types of telemetry
  val = yield EnvExpressions.eval("telemetry");
  equal(val.testfoo.payload.foo, 1, "value 'foo' is in mock telemetry");
  equal(val.testbar.payload.bar, 2, "value 'bar' is in mock telemetry");

  // Test has a date transform
  val = yield EnvExpressions.eval('"2016-04-22"|date');
  const d = new Date(Date.UTC(2016, 3, 22)); // months are 0 based
  equal(val.toString(), d.toString(), "Date transform works");

  // Test dates are comparable
  const context = {someTime: Date.UTC(2016, 0, 1)};
  val = yield EnvExpressions.eval('"2015-01-01"|date < someTime', context);
  ok(val, "dates are comparable with less-than");
  val = yield EnvExpressions.eval('"2017-01-01"|date > someTime', context);
  ok(val, "dates are comparable with greater-than");

  // Test stable sample returns true for matching samples
  val = yield EnvExpressions.eval('["test"]|stableSample(1)');
  equal(val, true, "Stable sample returns true for 100% sample");

  // Test stable sample returns true for matching samples
  val = yield EnvExpressions.eval('["test"]|stableSample(0)');
  equal(val, false, "Stable sample returns false for 0% sample");

  // Test stable sample for known samples
  val = yield EnvExpressions.eval('["test-1"]|stableSample(0.5)');
  equal(val, true, "Stable sample returns true for a known sample");
  val = yield EnvExpressions.eval('["test-4"]|stableSample(0.5)');
  equal(val, false, "Stable sample returns false for a known sample");

  // Test bucket sample for known samples
  val = yield EnvExpressions.eval('["test-1"]|bucketSample(0, 5, 10)');
  equal(val, true, "Bucket sample returns true for a known sample");
  val = yield EnvExpressions.eval('["test-4"]|bucketSample(0, 5, 10)');
  equal(val, false, "Bucket sample returns false for a known sample");
});
