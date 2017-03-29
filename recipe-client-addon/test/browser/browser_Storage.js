"use strict";

Cu.import("resource://shield-recipe-client/lib/Storage.jsm", this);

const fakeSandbox = { Promise, Error };
const store1 = Storage.makeStorage("prefix1", fakeSandbox);
const store2 = Storage.makeStorage("prefix2", fakeSandbox);

add_task(async function() {
  // Make sure values return null before being set
  Assert.equal(await store1.getItem("key"), null);
  Assert.equal(await store2.getItem("key"), null);

  // Set values to check
  await store1.setItem("key", "value1");
  await store2.setItem("key", "value2");

  // Check that they are available
  Assert.equal(await store1.getItem("key"), "value1");
  Assert.equal(await store2.getItem("key"), "value2");

  // Remove them, and check they are gone
  await store1.removeItem("key");
  await store2.removeItem("key");
  Assert.equal(await store1.getItem("key"), null);
  Assert.equal(await store2.getItem("key"), null);

  // Check that numbers are stored as numbers (not strings)
  await store1.setItem("number", 42);
  Assert.equal(await store1.getItem("number"), 42);

  // Check complex types work
  const complex = {a: 1, b: [2, 3], c: {d: 4}};
  await store1.setItem("complex", complex);
  Assert.deepEqual(await store1.getItem("complex"), complex);

  // Check that clearing the storage removes data from multiple
  // prefixes.
  await store1.setItem("removeTest", 1);
  await store2.setItem("removeTest", 2);
  Assert.equal(await store1.getItem("removeTest"), 1);
  Assert.equal(await store2.getItem("removeTest"), 2);
  await Storage.clearAllStorage();
  Assert.equal(await store1.getItem("removeTest"), null);
  Assert.equal(await store2.getItem("removeTest"), null);
});

// Tests fail if durability is not seeded properly
add_task(async function() {
  const store = Storage.makeStorage(Storage.DURABILITY_NAMESPACE, fakeSandbox);
  await Storage.seedDurability(fakeSandbox);

  // Properly seeded store should have a starting value of 1
  Assert.equal(await store.getItem(Storage.DURABILITY_KEY), 1, "Storage durability is set to 1 on start");
});

// Tests fails if storage is does not appear to be durable.
add_task(async function() {
  // Manually edit the storage durability values to be invalid
  const store = Storage.makeStorage(Storage.DURABILITY_NAMESPACE, fakeSandbox);
  await store.setItem(Storage.DURABILITY_KEY, -1);

  // Ensure invalid values fail durability checks
  try {
    await Storage.checkDurability(fakeSandbox);
    throw new Error('Did not throw error');
  } catch (err) {
    Assert.equal(err.message, 'Storage durability unconfirmed', "Storage durability fails for invalid values");
  }

  // Ensure NaN's fail durability checks
  await store.setItem(Storage.DURABILITY_KEY, 'not a number');
  try {
    await Storage.checkDurability(fakeSandbox);
    throw new Error('Did not throw error');
  } catch (err) {
    Assert.equal(err.message, 'Storage durability unconfirmed', "Storage durability fails for NaN values");
  }
});
