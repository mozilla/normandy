/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * blurb
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

const STORE_FILE = "shield-preference-recipes.json";

const PREFERENCE_TYPE_MAP = {
  boolean: Services.prefs.PREF_BOOL,
  string: Services.prefs.PREF_STRING,
  integer: Services.prefs.PREF_INT,
};


const DefaultPreferences = new Preferences({defaultBranch: true});
/**
 * Enum storing Preference modules for each type of preference branch.
 * @enum {Object}
 */
const PreferenceBranchType = {
  user: Preferences,
  default: DefaultPreferences,
};

const log = LogManager.getLogger("preference-management");

this.PreferenceManagement = (namespace) => ({
  preferenceObservers: new Map(),

  /**
   * Asynchronously load the JSON file that stores preference changes in the profile.
   */
  storePromise: null,
  ensureStorage() {
    if (this.storePromise === undefined) {
      const path = OS.Path.join(OS.Constants.Path.profileDir, STORE_FILE);
      const storage = new JSONFile({path});
      this.storePromise = storage.load().then(() => storage);
    }
    return this.storePromise;
  },

  async getStorage() {
    const store = await this.ensureStorage();
    store.data = store.data || {};
    store.data[namespace] = store.data[namespace] || {};

    return store;
  },

  async clearStorage() {
    const store = await this.getStorage();
    store.data[namespace] = {};
    store.saveSoon();
  },

  async setStorageItem(key, value) {
    const store = await this.getStorage();
    store.data[namespace][key] = value;
  },

  /**
   * Test wrapper that temporarily replaces the stored experiment data with fake
   * data for testing.
   */
  withMockData(testFunction) {
    const stopAllObservers = this.stopAllObservers.bind(this);

    const mockData = {};
    mockData[namespace] = {};

    this.storePromise = Promise.resolve({
      data: mockData,
      saveSoon() { },
    });

    return async (...args) => {
      try {
        await testFunction(mockData[namespace], ...args)
      } finally {
        stopAllObservers();
      }

      return await this.getStorage();
    };
  },

  async applyAll() {
    // On shutdown, clear all the observers that we're about to instantiate.
    CleanupManager.addCleanupHandler(this.stopAllObservers.bind(this));

    for (const experiment of await this.getActiveRecipes()) {
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

    if (this.preferenceObservers.has(recipeName)) {
      throw new Error(
        `An observer for the preference experiment ${recipeName} is already active.`
      );
    }

    const observerInfo = {
      preferenceName,
      observer(newValue) {
        if (newValue !== preferenceValue) {
          this.stop(recipeName, false);
        }
      },
    };
    this.preferenceObservers.set(recipeName, observerInfo);
    Preferences.observe(preferenceName, observerInfo.observer);
  },

  /**
   * Check if a preference observer is active for an experiment.
   * @param {string} recipeName
   * @return {Boolean}
   */
  hasObserver(recipeName) {
    log.debug(`PreferenceManagement.hasObserver(${recipeName})`);
    return this.preferenceObservers.has(recipeName);
  },

  /**
   * Disable a preference observer for the named experiment.
   * @param {string} recipeName
   * @throws {Error}
   *   If there is no active observer for the named experiment.
   */
  stopObserver(recipeName) {
    log.debug(`PreferenceManagement.stopObserver(${recipeName})`);

    if (!this.preferenceObservers.has(recipeName)) {
      throw new Error(`No observer for the preference experiment ${recipeName} found.`);
    }

    const {preferenceName, observer} = this.preferenceObservers.get(recipeName);
    Preferences.ignore(preferenceName, observer);
    this.preferenceObservers.delete(recipeName);
  },

  /**
   * Disable all currently-active preference observers for experiments.
   */
  stopAllObservers() {
    log.debug("PreferenceManagement.stopAllObservers()");
    for (const {preferenceName, observer} of this.preferenceObservers.values()) {
      Preferences.ignore(preferenceName, observer);
    }
    this.preferenceObservers.clear();
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

    const store = await this.getStorage();
    if (!(recipeName in store.data[namespace])) {
      throw new Error(`Could not find a preference experiment named "${recipeName}"`);
    }

    store.data[namespace][recipeName].lastSeen = new Date().toJSON();
    store.saveSoon();
  },

  async get(recipeName) {
    log.debug(`PreferenceManagement.get(${recipeName})`);
    const store = await this.getStorage();
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

    const store = await this.getStorage();
    store.data[namespace][recipe.name] = recipe;
    store.saveSoon();
  },

  async getActiveRecipes() {
    log.debug("PreferenceManagement.getActiveRecipes()");
    const allPrefs = await this.getAllPrefChanges();
    // Return copies so mutating them doesn't affect the storage.
    return allPrefs.filter(e => !e.expired).map(e => Object.assign({}, e));
  },

  async getAllPrefChanges() {
    log.debug("PreferenceManagement.getAllPrefChanges()");
    const store = await this.getStorage();

    // Return copies so mutating them doesn't affect the storage.
    return Object.values(store.data[namespace]).map(e => Object.assign({}, e));
  },

  async has(recipeName) {
    log.debug(`PreferenceManagement.has(${recipeName})`);
    const store = await this.getStorage();
    return store.data[namespace].hasOwnProperty(recipeName);
  },

  async expire(recipeName) {
    log.debug(`PreferenceManagement.expire(${recipeName})`);
    const store = await this.getStorage();
    delete store.data[namespace][recipeName];
  }
});
