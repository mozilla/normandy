"use strict";

const {utils: Cu} = Components;
Cu.import("resource://gre/modules/Preferences.jsm");
Cu.import("resource://gre/modules/TelemetryController.jsm", this);
Cu.import("resource://gre/modules/Task.jsm", this);

Cu.import("resource://shield-recipe-client/lib/ClientEnvironment.jsm", this);
Cu.import("resource://shield-recipe-client/test/browser/Utils.jsm", this);

add_task(function* testTelemetry() {
  // setup
  yield TelemetryController.submitExternalPing("testfoo", {foo: 1});
  yield TelemetryController.submitExternalPing("testbar", {bar: 2});
  const environment = ClientEnvironment.getEnvironment();

  // Test it can access telemetry
  const telemetry = yield environment.telemetry;
  is(typeof telemetry, "object", "Telemetry is accesible");

  // Test it reads different types of telemetry
  is(telemetry.testfoo.payload.foo, 1, "value 'foo' is in mock telemetry");
  is(telemetry.testbar.payload.bar, 2, "value 'bar' is in mock telemetry");
});

add_task(function* testUserId() {
  let environment = ClientEnvironment.getEnvironment();

  // Test that userId is available
  ok(Utils.UUID_REGEX.test(environment.userId), "userId available");

  // test that it pulls from the right preference
  yield SpecialPowers.pushPrefEnv({set: [["extensions.shield-recipe-client.user_id", "fake id"]]});
  environment = ClientEnvironment.getEnvironment();
  is(environment.userId, "fake id", "userId is pulled from preferences");
});

add_task(function* testDistribution() {
  let environment = ClientEnvironment.getEnvironment();

  // distribution id defaults to "default"
  is(environment.distribution, "default", "distribution has a default value");

  // distribution id is read from a preference
  yield SpecialPowers.pushPrefEnv({set: [["distribution.id", "funnelcake"]]});
  environment = ClientEnvironment.getEnvironment();
  is(environment.distribution, "funnelcake", "distribution is read from preferences");
});

const mockClassify = {country: "FR", request_time: new Date(2017, 1, 1)};
add_task(ClientEnvironment.withMockClassify(mockClassify, function* testCountryRequestTime() {
  const environment = ClientEnvironment.getEnvironment();

  // Test that country and request_time pull their data from the server.
  is(yield environment.country, mockClassify.country, "country is read from the server API");
  is(
    yield environment.request_time, mockClassify.request_time,
    "request_time is read from the server API"
  );
}));
