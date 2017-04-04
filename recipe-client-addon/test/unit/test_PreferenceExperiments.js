"use strict";

Cu.import("resource://gre/modules/Preferences.jsm");
Cu.import("resource://shield-recipe-client/lib/PreferenceExperiments.jsm");

load("utils.js"); /* globals withMockPreferences */

// Save ourselves some typing
const {withMockExperiments} = PreferenceExperiments;
const DefaultPreferences = new Preferences({defaultBranch: true});

function experimentFactory(attrs) {
  return Object.assign({
    name: "fakename",
    branch: "fakebranch",
    expired: false,
    lastSeen: new Date().toJSON(),
    preferenceName: "fake.preference",
    preferenceValue: "falkevalue",
    previousPreferenceValue: "oldfakevalue",
    preferenceBranchType: "default",
  }, attrs);
}

// clearAllExperimentStorage
add_task(withMockExperiments(function* (experiments) {
  experiments["test"] = experimentFactory({name: "test"});
  ok(yield PreferenceExperiments.has("test"), "Mock experiment is detected.");
  yield PreferenceExperiments.clearAllExperimentStorage();
  ok(
    !(yield PreferenceExperiments.has("test")),
    "clearAllExperimentStorage removed all stored experiments",
  );
}));

// start should throw if an experiment with the given name already exists
add_task(withMockExperiments(function* (experiments) {
  experiments["test"] = experimentFactory({name: "test"});
  yield Assert.rejects(
    PreferenceExperiments.start("test", "branch", "fake.preference", "value"),
    "start threw an error due to a conflicting experiment name",
  );
}));

// start should throw if an experiment for the given preference is active
add_task(withMockExperiments(function* (experiments) {
  experiments["test"] = experimentFactory({name: "test", preferenceName: "fake.preference"});
  yield Assert.rejects(
    PreferenceExperiments.start("different", "branch", "fake.preference", "value"),
    "start threw an error due to an active experiment for the given preference",
  );
}));

// start should throw if an invalid preferenceBranchType is given
add_task(withMockExperiments(function* (experiments) {
  experiments["test"] = experimentFactory({name: "test", preferenceName: "fake.preference"});
  yield Assert.rejects(
    PreferenceExperiments.start("different", "branch", "other.preference", "value", "invalid"),
    "start threw an error due to an invalid preference branch type",
  );
}));

// start should save experiment data, modify the preference, and register a
// watcher.
add_task(withMockExperiments(withMockPreferences(function* (experiments, mockPreferences) {
  const startObserver = sinon.stub(PreferenceExperiments, "startObserver");
  mockPreferences.set("fake.preference", "oldvalue", "default");

  yield PreferenceExperiments.start("test", "branch", "fake.preference", "newvalue", "default");
  ok("test" in experiments, "start saved the experiment");
  ok(
    startObserver.calledWith("test", "fake.preference", "newvalue"),
    "start registered an observer",
  );

  const expectedExperiment = {
    name: "test",
    branch: "branch",
    expired: false,
    preferenceName: "fake.preference",
    preferenceValue: "newvalue",
    previousPreferenceValue: "oldvalue",
    preferenceBranchType: "default",
  };
  const experiment = {};
  Object.keys(expectedExperiment).forEach(key => experiment[key] = experiments.test[key]);
  deepEqual(experiment, expectedExperiment, "start saved the experiment");

  equal(
    DefaultPreferences.get("fake.preference"),
    "newvalue",
    "start modified the default preference",
  );
  notEqual(
    Preferences.get("fake.preference"),
    "newvalue",
    "start did not modify the user preference",
  );

  startObserver.restore();
})));

// start should modify the user preference for the user branch type
add_task(withMockExperiments(withMockPreferences(function* (experiments, mockPreferences) {
  const startObserver = sinon.stub(PreferenceExperiments, "startObserver");
  mockPreferences.set("fake.preference", "oldvalue", "user");

  yield PreferenceExperiments.start("test", "branch", "fake.preference", "newvalue", "user");
  ok(
    startObserver.calledWith("test", "fake.preference", "newvalue"),
    "start registered an observer",
  );

  const expectedExperiment = {
    name: "test",
    branch: "branch",
    expired: false,
    preferenceName: "fake.preference",
    preferenceValue: "newvalue",
    previousPreferenceValue: "oldvalue",
    preferenceBranchType: "user",
  };
  const experiment = {};
  Object.keys(expectedExperiment).forEach(key => experiment[key] = experiments.test[key]);
  deepEqual(experiment, expectedExperiment, "start saved the experiment");

  notEqual(
    DefaultPreferences.get("fake.preference"),
    "newvalue",
    "start did not modify the default preference",
  );
  equal(Preferences.get("fake.preference"), "newvalue", "start modified the user preference");

  startObserver.restore();
})));

// startObserver should throw if an observer for the experiment is already
// active.
add_task(function* () {
  PreferenceExperiments.startObserver("test", "fake.preference", "newvalue");
  Assert.throws(
    () => PreferenceExperiments.startObserver("test", "another.fake", "othervalue"),
    "startObserver threw due to a conflicting active observer",
  );
  PreferenceExperiments.stopAllObservers();
});

// startObserver should register an observer that calls stop when a preference
// changes from its experimental value.
add_task(withMockPreferences(function* (mockPreferences) {
  const stop = sinon.stub(PreferenceExperiments, "stop");
  mockPreferences.set("fake.preference", "startvalue");

  PreferenceExperiments.startObserver("test", "fake.preference", "experimentvalue");

  // Setting it to the experimental value should not trigger the call.
  Preferences.set("fake.preference", "experimentvalue");
  ok(!stop.called, "Changing to the experimental pref value did not trigger the observer");

  // Setting it to something different should trigger the call.
  Preferences.set("fake.preference", "newvalue");
  ok(stop.called, "Changing to a different value triggered the observer");

  PreferenceExperiments.stopAllObservers();
  stop.restore();
}));

// startObserver should observe changes to the default preference value.
add_task(withMockPreferences(function* (mockPreferences) {
  const stop = sinon.stub(PreferenceExperiments, "stop");
  mockPreferences.set("fake.preference", "startvalue", "default");

  PreferenceExperiments.startObserver("test", "fake.preference", "experimentvalue");

  // Setting it to the experimental value should not trigger the call.
  DefaultPreferences.set("fake.preference", "experimentvalue");
  ok(!stop.called, "Changing to the experimental pref value did not trigger the observer");

  // Setting it to something different should trigger the call.
  DefaultPreferences.set("fake.preference", "newvalue");
  ok(stop.called, "Changing to a different value triggered the observer");

  PreferenceExperiments.stopAllObservers();
  stop.restore();
}));

// stopObserver should throw if there is no observer active for it to stop.
add_task(function* () {
  Assert.throws(
    () => PreferenceExperiments.stopObserver("neveractive", "another.fake", "othervalue"),
    "stopObserver threw because there was not matching active observer",
  );
});

// stopObserver should cancel an active observer.
add_task(withMockPreferences(function* (mockPreferences) {
  const stop = sinon.stub(PreferenceExperiments, "stop");
  mockPreferences.set("fake.preference", "startvalue");

  PreferenceExperiments.startObserver("test", "fake.preference", "experimentvalue");
  PreferenceExperiments.stopObserver("test");

  // Setting the preference now that the observer is stopped should not call
  // stop.
  Preferences.set("fake.preference", "newvalue");
  ok(!stop.called, "stopObserver successfully removed the observer");

  // Now that the observer is stopped, start should be able to start a new one
  // without throwing.
  try {
    PreferenceExperiments.startObserver("test", "fake.preference", "experimentvalue");
  } catch (err) {
    ok(false, "startObserver did not throw an error for an observer that was already stopped");
  }

  PreferenceExperiments.stopAllObservers();
  stop.restore();
}));

// stopAllObservers
add_task(withMockPreferences(function* (mockPreferences) {
  const stop = sinon.stub(PreferenceExperiments, "stop");
  mockPreferences.set("fake.preference", "startvalue");
  mockPreferences.set("other.fake.preference", "startvalue");

  PreferenceExperiments.startObserver("test", "fake.preference", "experimentvalue");
  PreferenceExperiments.startObserver("test2", "other.fake.preference", "experimentvalue");
  PreferenceExperiments.stopAllObservers();

  // Setting the preference now that the observers are stopped should not call
  // stop.
  Preferences.set("fake.preference", "newvalue");
  Preferences.set("other.fake.preference", "newvalue");
  ok(!stop.called, "stopAllObservers successfully removed all observers");

  // Now that the observers are stopped, start should be able to start new
  // observers without throwing.
  try {
    PreferenceExperiments.startObserver("test", "fake.preference", "experimentvalue");
    PreferenceExperiments.startObserver("test2", "other.fake.preference", "experimentvalue");
  } catch (err) {
    ok(false, "startObserver did not throw an error for an observer that was already stopped");
  }

  PreferenceExperiments.stopAllObservers();
  stop.restore();
}));

// markLastSeen should throw if it can't find a matching experiment
add_task(function* () {
  yield Assert.rejects(
    PreferenceExperiments.markLastSeen("neveractive"),
    "markLastSeen threw because there was not a matching experiment",
  );
});

// markLastSeen should update the lastSeen date
add_task(withMockExperiments(function* (experiments) {
  const oldDate = new Date(1988, 10, 1).toJSON();
  experiments["test"] = experimentFactory({name: "test", lastSeen: oldDate});
  yield PreferenceExperiments.markLastSeen("test");
  notEqual(
    experiments["test"].lastSeen,
    oldDate,
    "markLastSeen updated the experiment lastSeen date",
  );
}));

// stop should throw if an experiment with the given name doesn't exist
add_task(withMockExperiments(function* () {
  yield Assert.rejects(
    PreferenceExperiments.stop("test"),
    "stop threw an error because there are no experiments with the given name",
  );
}));

// stop should throw if the experiment is already expired
add_task(withMockExperiments(function* (experiments) {
  experiments["test"] = experimentFactory({name: "test", expired: true});
  yield Assert.rejects(
    PreferenceExperiments.stop("test"),
    "stop threw an error because the experiment was already expired",
  );
}));

// stop should mark the experiment as expired, stop its observer, and revert the
// preference value.
add_task(withMockExperiments(withMockPreferences(function* (experiments, mockPreferences) {
  const stopObserver = sinon.stub(PreferenceExperiments, "stopObserver");
  mockPreferences.set("fake.preference", "experimentvalue", "default");
  experiments["test"] = experimentFactory({
    name: "test",
    expired: false,
    preferenceName: "fake.preference",
    preferenceValue: "experimentvalue",
    previousPreferenceValue: "oldvalue",
    preferenceBranchType: "default",
  });

  yield PreferenceExperiments.stop("test");
  ok(stopObserver.calledWith("test"), "stop removed an observer");
  equal(experiments["test"].expired, true, "stop marked the experiment as expired");
  equal(
    DefaultPreferences.get("fake.preference"),
    "oldvalue",
    "stop reverted the preference to its previous value",
  );

  stopObserver.restore();
})));

// stop should also support user pref experiments
add_task(withMockExperiments(withMockPreferences(function* (experiments, mockPreferences) {
  const stopObserver = sinon.stub(PreferenceExperiments, "stopObserver");
  mockPreferences.set("fake.preference", "experimentvalue", "user");
  experiments["test"] = experimentFactory({
    name: "test",
    expired: false,
    preferenceName: "fake.preference",
    preferenceValue: "experimentvalue",
    previousPreferenceValue: "oldvalue",
    preferenceBranchType: "user",
  });

  yield PreferenceExperiments.stop("test");
  ok(stopObserver.calledWith("test"), "stop removed an observer");
  equal(experiments["test"].expired, true, "stop marked the experiment as expired");
  equal(
    Preferences.get("fake.preference"),
    "oldvalue",
    "stop reverted the preference to its previous value",
  );

  stopObserver.restore();
})));

// stop should remove a preference that had no value prior to an experiment for user prefs
add_task(withMockExperiments(withMockPreferences(function* (experiments, mockPreferences) {
  const stopObserver = sinon.stub(PreferenceExperiments, "stopObserver");
  mockPreferences.set("fake.preference", "experimentvalue", "user");
  experiments["test"] = experimentFactory({
    name: "test",
    expired: false,
    preferenceName: "fake.preference",
    preferenceValue: "experimentvalue",
    previousPreferenceValue: undefined,
    preferenceBranchType: "user",
  });

  yield PreferenceExperiments.stop("test");
  ok(
    !Preferences.has("fake.preference"),
    "stop removed the preference that had no value prior to the experiment",
  );

  stopObserver.restore();
})));

// stop should not modify a preference if resetValue is false
add_task(withMockExperiments(withMockPreferences(function* (experiments, mockPreferences) {
  const stopObserver = sinon.stub(PreferenceExperiments, "stopObserver");
  mockPreferences.set("fake.preference", "customvalue", "default");
  experiments["test"] = experimentFactory({
    name: "test",
    expired: false,
    preferenceName: "fake.preference",
    preferenceValue: "experimentvalue",
    previousPreferenceValue: "oldvalue",
    peferenceBranchType: "default",
  });

  yield PreferenceExperiments.stop("test", false);
  equal(
    DefaultPreferences.get("fake.preference"),
    "customvalue",
    "stop did not modify the preference",
  );

  stopObserver.restore();
})));

// get should throw if no experiment exists with the given name
add_task(withMockExperiments(function* () {
  yield Assert.rejects(
    PreferenceExperiments.get("neverexisted"),
    "get rejects if no experiment with the given name is found",
  );
}));

// get
add_task(withMockExperiments(function* (experiments) {
  const experiment = experimentFactory({name: "test"});
  experiments["test"] = experiment;

  const fetchedExperiment = yield PreferenceExperiments.get("test");
  deepEqual(fetchedExperiment, experiment, "get fetches the correct experiment");

  // Modifying the fetched experiment must not edit the data source.
  fetchedExperiment.name = "othername";
  equal(experiments["test"].name, "test", "get returns a copy of the experiment");
}));

add_task(withMockExperiments(async function testGetAll(experiments) {
  const experiment1 = experimentFactory({name: "experiment1"});
  const experiment2 = experimentFactory({name: "experiment2", disabled: true});
  experiments["experiment1"] = experiment1;
  experiments["experiment2"] = experiment2;

  const fetchedExperiments = await PreferenceExperiments.getAll();
  equal(fetchedExperiments.length, 2, "getAll returns a list of all stored experiments");
  deepEqual(
    fetchedExperiments.find(e => e.name === "experiment1"),
    experiment1,
    "getAll returns a list with the correct experiments",
  );
  const fetchedExperiment2 = fetchedExperiments.find(e => e.name === "experiment2");
  deepEqual(
    fetchedExperiment2,
    experiment2,
    "getAll returns a list with the correct experiments, including disabled ones",
  );

  fetchedExperiment2.name = "othername";
  equal(experiment2.name, "experiment2", "getAll returns copies of the experiments");
}));

// has
add_task(withMockExperiments(function* (experiments) {
  experiments["test"] = experimentFactory({name: "test"});
  ok(yield PreferenceExperiments.has("test"), "has returned true for a stored experiment");
  ok(!(yield PreferenceExperiments.has("missing")), "has returned false for a missing experiment");
}));

// init should set the default preference value for active, default experiments
add_task(withMockExperiments(withMockPreferences(function* testInit(experiments, mockPreferences) {
  experiments["user"] = experimentFactory({
    preferenceName: "user",
    preferenceValue: true,
    expired: false,
    preferenceBranchType: "user",
  });
  experiments["default"] = experimentFactory({
    preferenceName: "default",
    preferenceValue: true,
    expired: false,
    preferenceBranchType: "default",
  });
  experiments["expireddefault"] = experimentFactory({
    preferenceName: "expireddefault",
    preferenceValue: true,
    expired: true,
    preferenceBranchType: "default",
  });

  for (const name of Object.keys(experiments)) {
    mockPreferences.set(name, false, "default");
  }

  yield PreferenceExperiments.init();

  equal(DefaultPreferences.get("user"), false, "init ignored a user pref experiment");
  equal(
    DefaultPreferences.get("expireddefault"),
    false,
    "init ignored an expired default pref experiment",
  );
  equal(
    DefaultPreferences.get("default"),
    true,
    "init set the value for a default pref experiment",
  );
})));
