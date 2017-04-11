"use strict";

Cu.import("resource://shield-recipe-client/lib/NormandyDriver.jsm", this);
Cu.import("resource://shield-recipe-client/lib/Storage.jsm", this);


// Storage durability checks occur when drivers create new Storage instances.
// This test determines if `skipDurabilityCheck` correctly ignores the
// store durability.
add_task(async function(){
  const fakeSandbox = { Promise, Error };
  const driver = new NormandyDriver({ sandbox: fakeSandbox });

  const store = Storage.makeStorage(Storage.DURABILITY_NAMESPACE, fakeSandbox);
  await store.setItem(Storage.DURABILITY_KEY, -1);
  let hadError = false;

  try {
    // Create storage with the 'skipDurabilityCheck' flag set to true
    await driver.createStorage('test', true);
  } catch(e) {
    hadError = true;
  }
  Assert.equal(hadError, false, 'skipDurabilityCheck should ignore bad storage durability');


  await store.setItem(Storage.DURABILITY_KEY, -1);
  try {
    // Create storage with 'skipDurabilityCheck' disabled
    await driver.createStorage('test', false);
  } catch(e) {
    Assert.equal(e.message, 'Storage durability unconfirmed',
      'skipDurabilityCheck should throw an error for invalid storage durability');
  }
});

add_task(withDriver(Assert, async function uuids(driver) {
  // Test that it is a UUID
  const uuid1 = driver.uuid();
  ok(UUID_REGEX.test(uuid1), "valid uuid format");

  // Test that UUIDs are different each time
  const uuid2 = driver.uuid();
  isnot(uuid1, uuid2, "uuids are unique");
}));

add_task(withDriver(Assert, async function userId(driver) {
  // Test that userId is a UUID
  ok(UUID_REGEX.test(driver.userId), "userId is a uuid");
}));

add_task(withDriver(Assert, async function syncDeviceCounts(driver) {
  let client = await driver.client();
  is(client.syncMobileDevices, 0, "syncMobileDevices defaults to zero");
  is(client.syncDesktopDevices, 0, "syncDesktopDevices defaults to zero");
  is(client.syncTotalDevices, 0, "syncTotalDevices defaults to zero");

  await SpecialPowers.pushPrefEnv({
    set: [
      ["services.sync.clients.devices.mobile", 5],
      ["services.sync.clients.devices.desktop", 4],
    ],
  });

  client = await driver.client();
  is(client.syncMobileDevices, 5, "syncMobileDevices is read when set");
  is(client.syncDesktopDevices, 4, "syncDesktopDevices is read when set");
  is(client.syncTotalDevices, 9, "syncTotalDevices is read when set");
}));

add_task(withDriver(Assert, async function distribution(driver) {
  let client = await driver.client();
  is(client.distribution, "default", "distribution has a default value");

  await SpecialPowers.pushPrefEnv({set: [["distribution.id", "funnelcake"]]});
  client = await driver.client();
  is(client.distribution, "funnelcake", "distribution is read from preferences");
}));
