/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Preference Experiments temporarily change a preference to one of several test
 * values for the duration of the experiment. Telemetry packets are annotated to
 * show what experiments are active, and we use this data to measure the
 * effectiveness of the preference change.
 *
 * Info on active and past experiments is stored in a JSON file in the profile
 * folder.
 *
 * Active preference experiments are stopped if they aren't active on the recipe
 * server. They also expire if Firefox isn't able to contact the recipe server
 * after a period of time, as well as if the user modifies the preference during
 * an active experiment.
 */

/**
 * Experiments store info about an active or expired preference experiment.
 * They are single-depth objects to simplify cloning.
 * @typedef {Object} Experiment
 * @property {string} name
 *   Unique name of the experiment
 * @property {string} branch
 *   Experiment branch that the user was matched to
 * @property {boolean} expired
 *   If false, the experiment is active.
 * @property {string} lastSeen
 *   ISO-formatted date string of when the experiment was last seen from the
 *   recipe server.
 * @property {string} preferenceName
 *   Name of the preference affected by this experiment.
 * @property {string|integer|boolean} preferenceValue
 *   Value to change the preference to during the experiment.
 * @property {string|integer|boolean|undefined} previousPreferenceValue
 *   Value of the preference prior to the experiment, or undefined if it was
 *   unset.
 */

"use strict";

const {utils: Cu} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "CleanupManager", "resource://shield-recipe-client/lib/CleanupManager.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "JSONFile", "resource://gre/modules/JSONFile.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "OS", "resource://gre/modules/osfile.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "LogManager", "resource://shield-recipe-client/lib/LogManager.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "Preferences", "resource://gre/modules/Preferences.jsm");

this.EXPORTED_SYMBOLS = ["PreferenceExperiments"];

const EXPERIMENT_FILE = "shield-preference-experiments.json";

/**
 * Asynchronously load the JSON file that stores experiment status in the profile.
 */
let storePromise;
function ensureStorage() {
  if (storePromise === undefined) {
    const path = OS.Path.join(OS.Constants.Path.profileDir, EXPERIMENT_FILE);
    const storage = new JSONFile({path});
    storePromise = storage.load().then(() => storage);
  }
  return storePromise;
}

const log = LogManager.getLogger("preference-experiments");

// List of active preference observers. Cleaned up on shutdown.
const experimentObservers = new Map();
CleanupManager.addCleanupHandler(() => PreferenceExperiments.stopAllObservers());

this.PreferenceExperiments = {
  /**
   * Test wrapper that temporarily replaces the stored experiment data with fake
   * data for testing.
   */
  withMockExperiments(testFunction) {
    return async function inner(...args) {
      const oldPromise = storePromise;
      const mockExperiments = {};
      storePromise = Promise.resolve({
        data: mockExperiments,
        saveSoon() { },
      });
      try {
        await testFunction(...args, mockExperiments);
      } finally {
        storePromise = oldPromise;
      }
    };
  },

  /**
   * Clear all stored data about active and past experiments.
   */
  async clearAllExperimentStorage() {
    const store = await ensureStorage();
    store.data = {};
    store.saveSoon();
  },

  /**
   * Start a new preference experiment.
   * @param  {string} experimentName
   * @param  {string} branch
   * @param  {string} preferenceName
   * @param  {string|integer|boolean} preferenceValue
   * @rejects {Error}
   *   If an experiment with the given name already exists, or if an experiment
   *   for the given preference is active.
   */
  async start(experimentName, branch, preferenceName, preferenceValue) {
    log.debug(`PreferenceExperiments.start(${experimentName}, ${branch})`);

    const store = await ensureStorage();
    if (experimentName in store.data) {
      throw new Error(`A preference experiment named "${experimentName}" already exists.`);
    }

    const activeExperiments = Object.values(store.data).filter(e => !e.expired);
    const hasConflictingExperiment = activeExperiments.some(
      e => e.preferenceName === preferenceName
    );
    if (hasConflictingExperiment) {
      throw new Error(
        `Another preference experiment for the pref "${preferenceName}" is currently active.`
      );
    }

    /** @type {Experiment} */
    const experiment = {
      name: experimentName,
      branch,
      expired: false,
      lastSeen: new Date().toJSON(),
      preferenceName,
      preferenceValue,
      previousPreferenceValue: Preferences.get(preferenceName, undefined),
    };

    Preferences.set(preferenceName, preferenceValue);
    PreferenceExperiments.startObserver(experimentName, preferenceName, preferenceValue);
    store.data[experimentName] = experiment;
    store.saveSoon();
  },

  /**
   * Register a preference observer that stops an experiment when the user
   * modifies the preference.
   * @param {string} experimentName
   * @param {string} preferenceName
   * @param {string|integer|boolean} preferenceValue
   * @throws {Error}
   *   If an observer for the named experiment is already active.
   */
  startObserver(experimentName, preferenceName, preferenceValue) {
    log.debug(`PreferenceExperiments.startObserver(${experimentName})`);

    if (experimentObservers.has(experimentName)) {
      throw new Error(
        `An observer for the preference experiment ${experimentName} is already active.`
      );
    }

    const observerInfo = {
      preferenceName,
      observer(newValue) {
        if (newValue !== preferenceValue) {
          PreferenceExperiments.stop(experimentName, false);
        }
      },
    };
    experimentObservers.set(experimentName, observerInfo);
    Preferences.observe(preferenceName, observerInfo.observer);
  },

  /**
   * Disable a preference observer for the named experiment.
   * @param {string} experimentName
   * @throws {Error}
   *   If there is no active observer for the named experiment.
   */
  stopObserver(experimentName) {
    log.debug(`PreferenceExperiments.stopObserver(${experimentName})`);

    if (!experimentObservers.has(experimentName)) {
      throw new Error(`No observer for the preference experiment ${experimentName} found.`);
    }

    const {preferenceName, observer} = experimentObservers.get(experimentName);
    Preferences.ignore(preferenceName, observer);
    experimentObservers.delete(experimentName);
  },

  /**
   * Disable all currently-active preference observers for experiments.
   */
  stopAllObservers() {
    log.debug("PreferenceExperiments.stopAllObservers()");
    for (const {preferenceName, observer} of experimentObservers.values()) {
      Preferences.ignore(preferenceName, observer);
    }
    experimentObservers.clear();
  },

  /**
   * Update the timestamp storing when Normandy last sent a recipe for the named
   * experiment.
   * @param {string} experimentName
   * @rejects {Error}
   *   If there is no stored experiment with the given name.
   */
  async markLastSeen(experimentName) {
    log.debug(`PreferenceExperiments.markLastSeen(${experimentName})`);

    const store = await ensureStorage();
    if (!(experimentName in store.data)) {
      throw new Error(`Could not find a preference experiment named "${experimentName}"`);
    }

    store.data[experimentName].lastSeen = new Date().toJSON();
    store.saveSoon();
  },

  /**
   * Stop an active experiment, deactivate preference watchers, and optionally
   * reset the associated preference to its previous value.
   * @param {string} experimentName
   * @param {boolean} [resetValue=true]
   *   If true, reset the preference to its original value.
   * @rejects {Error}
   *   If there is no stored experiment with the given name, or if the
   *   experiment has already expired.
   */
  async stop(experimentName, resetValue = true) {
    log.debug(`PreferenceExperiments.stop(${experimentName})`);

    const store = await ensureStorage();
    if (!(experimentName in store.data)) {
      throw new Error(`Could not find a preference experiment named "${experimentName}"`);
    }

    const experiment = store.data[experimentName];
    if (experiment.expired) {
      throw new Error(
        `Cannot stop preference experiment "${experimentName}" because it is already expired`
      );
    }

    PreferenceExperiments.stopObserver(experimentName);

    if (resetValue) {
      const {preferenceName, previousPreferenceValue} = experiment;
      if (previousPreferenceValue !== undefined) {
        Preferences.set(preferenceName, previousPreferenceValue);
      } else {
        Preferences.reset(preferenceName);
      }
    }

    experiment.expired = true;
    store.saveSoon();
  },

  /**
   * Get the experiment object for the named experiment.
   * @param {string} experimentName
   * @resolves {Experiment}
   * @rejects {Error}
   *   If no preference experiment exists with the given name.
   */
  async get(experimentName) {
    log.debug(`PreferenceExperiments.get(${experimentName})`);
    const store = await ensureStorage();
    if (!(experimentName in store.data)) {
      throw new Error(`Could not find a preference experiment named "${experimentName}"`);
    }

    // Return a copy so mutating it doesn't affect the storage.
    return Object.assign({}, store.data[experimentName]);
  },

  /**
   * Get a list of all stored experiment objects.
   * @resolves {Experiment[]}
   */
  async getAll() {
    const store = await ensureStorage();

    // Return copies so that mutating returned experiments doesn't affect the
    // stored values.
    return Object.values(store.data).map(experiment => Object.assign({}, experiment));
  },

  /**
   * Check if an experiment exists with the given name.
   * @param {string} experimentName
   * @resolves {boolean} True if the experiment exists, false if it doesn't.
   */
  async has(experimentName) {
    log.debug(`PreferenceExperiments.has(${experimentName})`);
    const store = await ensureStorage();
    return experimentName in store.data;
  },
};
