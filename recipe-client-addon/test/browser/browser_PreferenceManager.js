"use strict";

Cu.import("resource://gre/modules/Preferences.jsm", this);
Cu.import("resource://shield-recipe-client/lib/PreferenceManager.jsm", this);

// Save ourselves some typing
const Manager = new PreferenceManager("test");
const withMockData = Manager.withMockData.bind(Manager);

// clearStorage
add_task(withMockData(async function(experiments) {
  experiments["test"] = experimentFactory({name: "test"});

  ok(await Manager.hasRecipe("test"), "Mock experiment is detected.");
  await Manager.clearStorage();
  ok(
    !(await Manager.hasRecipe("test")),
    "clearStorage removed all stored experiments",
  );
}));


// startObserver should throw if an observer for the experiment is already
// active.
add_task(withMockData(async function() {
  Manager.startObserver("test", "fake.preference", "newvalue");
  Assert.throws(
    () => Manager.startObserver("test", "another.fake", "othervalue"),
    "startObserver threw due to a conflicting active observer",
  );
  Manager.stopAllObservers();
}));

add_task(withMockData(async function testHasObserver() {
  Manager.startObserver("test", "fake.preference", "experimentValue");

  ok(await Manager.hasObserver("test"), "hasObserver detects active observers");
  ok(
    !(await Manager.hasObserver("missing")),
    "hasObserver doesn't detect inactive observers",
  );

  Manager.stopAllObservers();
}));

// stopObserver should throw if there is no observer active for it to stop.
add_task(withMockData(async function() {
  Assert.throws(
    () => Manager.stopObserver("neveractive", "another.fake", "othervalue"),
    "stopObserver threw because there was not matching active observer",
  );
}));

// markLastSeen should throw if it can't find a matching experiment
add_task(withMockData(async function() {
  await Assert.rejects(
    Manager.markLastSeen("neveractive"),
    "markLastSeen threw because there was not a matching experiment",
  );
}));

// markLastSeen should update the lastSeen date
add_task(withMockData(async function(experiments) {
  const oldDate = new Date(1988, 10, 1).toJSON();
  experiments["test"] = experimentFactory({name: "test", lastSeen: oldDate});
  await Manager.markLastSeen("test");
  Assert.notEqual(
    experiments["test"].lastSeen,
    oldDate,
    "markLastSeen updated the experiment lastSeen date",
  );
}));

// get should throw if no experiment exists with the given name
add_task(withMockData(async function() {
  await Assert.rejects(
    Manager.getRecipe("neverexisted"),
    "get rejects if no experiment with the given name is found",
  );
}));

// get should return the currently stored experiment appropriately
add_task(withMockData(async function(experiments) {
  const experiment = experimentFactory({name: "test"});
  experiments["test"] = experiment;

  const fetchedExperiment = await Manager.getRecipe("test");
  Assert.deepEqual(fetchedExperiment, experiment, "get fetches the correct experiment");

  // Modifying the fetched experiment must not edit the data source.
  fetchedExperiment.name = "othername";
  is(experiments["test"].name, "test", "get returns a copy of the experiment");
}));


// getStoredRecipes should return all stored recipes, regardless of expired state
add_task(withMockData(async function testGetStoredRecipes(experiments) {
  const experiment1 = experimentFactory({name: "experiment1"});
  const experiment2 = experimentFactory({name: "experiment2", disabled: true});
  experiments["experiment1"] = experiment1;
  experiments["experiment2"] = experiment2;

  const fetchedExperiments = await Manager.getStoredRecipes();
  is(fetchedExperiments.length, 2, "getStoredRecipes returns a list of all stored experiments");
  Assert.deepEqual(
    fetchedExperiments.find(e => e.name === "experiment1"),
    experiment1,
    "getStoredRecipes returns a list with the correct experiments",
  );
  const fetchedExperiment2 = fetchedExperiments.find(e => e.name === "experiment2");
  Assert.deepEqual(
    fetchedExperiment2,
    experiment2,
    "getStoredRecipes returns a list with the correct experiments, including disabled ones",
  );

  fetchedExperiment2.name = "othername";
  is(experiment2.name, "experiment2", "getStoredRecipes returns copies of the experiments");
}));

// getActiveRecipes should
add_task(withMockData(withMockPreferences(async function testGetActiveRecipes(experiments) {
  experiments["active"] = experimentFactory({
    name: "active",
    expired: false,
  });
  experiments["inactive"] = experimentFactory({
    name: "inactive",
    expired: true,
  });

  const activeExperiments = await Manager.getActiveRecipes();
  Assert.deepEqual(
    activeExperiments,
    [experiments["active"]],
    "getActiveRecipes only returns active experiments",
  );

  activeExperiments[0].name = "newfakename";
  Assert.notEqual(
    experiments["active"].name,
    "newfakename",
    "getActiveRecipes returns copies of stored experiments",
  );
})));

// has
add_task(withMockData(async function(experiments) {
  experiments["test"] = experimentFactory({name: "test"});
  ok(await Manager.hasRecipe("test"), "has returned true for a stored experiment");
  ok(!(await Manager.hasRecipe("missing")), "has returned false for a missing experiment");
}));
