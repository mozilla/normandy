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
 * @property {string} preferenceType
 *   Type of the preference value being set.
 * @property {string|integer|boolean|undefined} previousPreferenceValue
 *   Value of the preference prior to the experiment, or undefined if it was
 *   unset.
 * @property {PreferenceBranchType} preferenceBranchType
 *   Controls how we modify the preference to affect the client.
 * @rejects {Error}
 *   If the given preferenceType does not match the existing stored preference.
 *
 *   If "default", when the experiment is active, the default value for the
 *   preference is modified on startup of the add-on. If "user", the user value
 *   for the preference is modified when the experiment starts, and is reset to
 *   its original value when the experiment ends.
 */

"use strict";

const {utils: Cu} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "Services", "resource://gre/modules/Services.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "CleanupManager", "resource://shield-recipe-client/lib/CleanupManager.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "JSONFile", "resource://gre/modules/JSONFile.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "OS", "resource://gre/modules/osfile.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "LogManager", "resource://shield-recipe-client/lib/LogManager.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "Preferences", "resource://gre/modules/Preferences.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "TelemetryEnvironment", "resource://gre/modules/TelemetryEnvironment.jsm");

this.EXPORTED_SYMBOLS = ["PreferenceManagement"];

const EXPERIMENT_FILE = "shield-preference-recipes.json";

const PREFERENCE_TYPE_MAP = {
  boolean: Services.prefs.PREF_BOOL,
  string: Services.prefs.PREF_STRING,
  integer: Services.prefs.PREF_INT,
};

const DefaultPreferences = new Preferences({defaultBranch: true});


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

/**
 * Enum storing Preference modules for each type of preference branch.
 * @enum {Object}
 */
const PreferenceBranchType = {
  user: Preferences,
  default: DefaultPreferences,
};

const log = LogManager.getLogger("preference-management");

// List of active preference observers. Cleaned up on shutdown.
let preferenceObservers = new Map();
CleanupManager.addCleanupHandler(() => PreferenceManagement.stopAllObservers());

this.PreferenceManagement = (namespace) => ({
  async applyAll() {
    for (const experiment of await this.getActive()) {
      // Set experiment default preferences, since they don't persist between restarts
      if (experiment.preferenceBranchType === "default") {
        DefaultPreferences.set(experiment.preferenceName, experiment.preferenceValue);
      }

      // Notify Telemetry of experiments we're running, since they don't persist between restarts
      TelemetryEnvironment.setExperimentActive(experiment.name, experiment.branch);

      // Watch for changes to the experiment's preference
      this.startObserver(experiment.name, experiment.preferenceName, experiment.preferenceValue);
    }
  },

  async clearPreferenceStorage() {
    const store = await ensureStorage();
    store.data[namespace] = {};
    store.saveSoon();
  },

  getPreferenceBranch(which) {
    const branch = PreferenceBranchType[which];
    if (!branch) {
      throw new Error(`Invalid value for preference branch: "${which}"`);
    }

    return branch;
  },

  /**
   * Register a preference observer that stops an experiment when the user
   * modifies the preference.
   * @param {string} recipeName
   * @param {string} preferenceName
   * @param {string|integer|boolean} preferenceValue
   * @throws {Error}
   *   If an observer for the named experiment is already active.
   */
  startObserver(recipeName, preferenceName, preferenceValue) {
    log.debug(`PreferenceManagement.startObserver(${recipeName})`);

    if (preferenceObservers.has(recipeName)) {
      throw new Error(
        `An observer for the preference experiment ${recipeName} is already active.`
      );
    }

    const observerInfo = {
      preferenceName,
      observer(newValue) {
        if (newValue !== preferenceValue) {
          PreferenceManagement.stop(recipeName, false);
        }
      },
    };
    preferenceObservers.set(recipeName, observerInfo);
    Preferences.observe(preferenceName, observerInfo.observer);
  },

  /**
   * Check if a preference observer is active for an experiment.
   * @param {string} recipeName
   * @return {Boolean}
   */
  hasObserver(recipeName) {
    log.debug(`PreferenceManagement.hasObserver(${recipeName})`);
    return preferenceObservers.has(recipeName);
  },

  /**
   * Disable a preference observer for the named experiment.
   * @param {string} recipeName
   * @throws {Error}
   *   If there is no active observer for the named experiment.
   */
  stopObserver(recipeName) {
    log.debug(`PreferenceManagement.stopObserver(${recipeName})`);

    if (!preferenceObservers.has(recipeName)) {
      throw new Error(`No observer for the preference experiment ${recipeName} found.`);
    }

    const {preferenceName, observer} = preferenceObservers.get(recipeName);
    Preferences.ignore(preferenceName, observer);
    preferenceObservers.delete(recipeName);
  },

  /**
   * Disable all currently-active preference observers for experiments.
   */
  stopAllObservers() {
    log.debug("PreferenceManagement.stopAllObservers()");
    for (const {preferenceName, observer} of preferenceObservers.values()) {
      Preferences.ignore(preferenceName, observer);
    }
    preferenceObservers.clear();
  },

  /**
   * Update the timestamp storing when Normandy last sent a recipe for the named
   * experiment.
   * @param {string} recipeName
   * @rejects {Error}
   *   If there is no stored experiment with the given name.
   */
  async markLastSeen(recipeName) {
    log.debug(`PreferenceManagement.markLastSeen(${recipeName})`);

    const store = await ensureStorage();
    if (!(recipeName in store.data[namespace])) {
      throw new Error(`Could not find a preference experiment named "${recipeName}"`);
    }

    store.data[namespace][recipeName].lastSeen = new Date().toJSON();
    store.saveSoon();
  },

  /**
   * Get the experiment object for the named experiment.
   * @param {string} recipeName
   * @resolves {Experiment}
   * @rejects {Error}
   *   If no preference experiment exists with the given name.
   */
  async get(recipeName) {
    log.debug(`PreferenceManagement.get(${recipeName})`);
    const store = await ensureStorage();
    if (!(recipeName in store.data[namespace])) {
      throw new Error(`Could not find a preference experiment named "${recipeName}"`);
    }

    // Return a copy so mutating it doesn't affect the storage.
    return Object.assign({}, store.data[namespace][recipeName]);
  },

  validateRecipe({ preferenceName, preferenceType }) {
    const prevPrefType = Services.prefs.getPrefType(preferenceName);
    const givenPrefType = PREFERENCE_TYPE_MAP[preferenceType];

    if (!preferenceType || !givenPrefType) {
      throw new Error(`Invalid preferenceType provided (given "${preferenceType}")`);
    }

    if (prevPrefType !== Services.prefs.PREF_INVALID && prevPrefType !== givenPrefType) {
      throw new Error(
        `Previous preference value is of type "${prevPrefType}", but was given "${givenPrefType}" (${preferenceType})`
      );
    }

    return true;
  },

  async saveRecipeData(recipe) {
    log.debug("PreferenceManagement.saveRecipeData()");

    const store = await ensureStorage();
    store.data[namespace][recipe.name] = recipe;
    store.saveSoon();
  },

  /**
  * Get a list of experiment objects for all active experiments.
  * @resolves {Experiment[]}
  */
  async getActive() {
    log.debug("PreferenceManagement.getActive()");
    // Return copies so mutating them doesn't affect the storage.
    return await this.getActivePrefChanges().filter(e => !e.expired)
      .map(e => Object.assign({}, e));
  },

  async getActivePrefChanges() {
    log.debug("PreferenceManagement.getActivePrefChanges()");
    const store = await ensureStorage();

    // Return copies so mutating them doesn't affect the storage.
    return Object.values(store.data[namespace]).map(e => Object.assign({}, e));
  },

  /**
   * Check if an experiment exists with the given name.
   * @param {string} recipeName
   * @resolves {boolean} True if the experiment exists, false if it doesn't.
   */
  async has(recipeName) {
    log.debug(`PreferenceManagement.has(${recipeName})`);
    const store = await ensureStorage();
    return recipeName in store.data[namespace];
  },

  async expire(recipeName) {
    log.debug(`PreferenceManagement.expire(${recipeName})`);
    const store = await ensureStorage();
    delete store.data[namespace][recipeName];
  }

});
