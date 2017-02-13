"use strict";

const {utils: Cu} = Components;
Cu.import("resource://shield-recipe-client/lib/NormandyApi.jsm", this);

add_task(function* test_get() {
  // Point the add-on to the test server.
  const url = "http://mochi.test:8888/browser/browser/extensions/shield-recipe-client/test";
  yield SpecialPowers.pushPrefEnv({set: [["extensions.shield-recipe-client.api_url", url]]});

  // Test that NormandyApi can fetch from the test server.
  const response = yield NormandyApi.get(`${url}/browser/test_server.sjs`);
  const data = yield response.json();
  Assert.deepEqual(data, {test: "data"}, "NormandyApi returned correct server data.");
});
