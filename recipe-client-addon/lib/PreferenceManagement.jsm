/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * PreferenceManagement exposes an API for recipes such as Preference Experiments
 * to handle manipulating default/user branch preferences. Recipes should extend
 * this module.
 *
 * Info on active and past recipes is stored in a JSON file in the profile
 * folder. Preference observers can also be tracked/instantiated/etc.
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

  // Internal 'store loaded' tracking object
  storePromise: undefined,

  /**
   * Asynchronously loads the local JSON file used for storage, returning the
   * request Promise.
   *
   * @returns {Promise}
   * @resolves When the operation is completed succesfully
   * @rejects Javascript exception.
   */
  ensureStorage() {
    if (this.storePromise === undefined) {
      const path = OS.Path.join(OS.Constants.Path.profileDir, STORE_FILE);
      const storage = new JSONFile({path});
      this.storePromise = storage.load().then(() => storage);
    }
    return this.storePromise;
  },

  /**
   * Returns the internal storage object, after properly ensuring the store and
   * store namespace are initiated.
   *
   * @returns {Promise}
   * @resolves When the operation is completed succesfully
   * @rejects Javascript exception.
   */
  async getStorage() {
    const store = await this.ensureStorage();
    store.data = store.data || {};
    store.data[namespace] = store.data[namespace] || {};
    store.saveSoon();

    return store;
  },

  /**
   * Clears the namespaced storage.
   *
   * @returns {Promise}
   * @resolves When the operation is completed succesfully
   * @rejects Javascript exception.
   */
  async clearStorage() {
    const store = await this.getStorage();
    store.data[namespace] = {};
    store.saveSoon();
  },


  /**
   * Returns the internal storage object, after properly ensuring the store and
   * store namespace are initiated.
   *
   * @returns {Promise}
   * @resolves When the operation is completed succesfully
   * @rejects Javascript exception.
   */
  async setStorageItem(key, value) {
    const store = await this.getStorage();
    store.data[namespace][key] = value;
  },

  /**
   * Test wrapper that temporarily replaces the stored recipe data with fake
   * data for testing. Given a test function, mocks the data store, then executes
   * that function.
   */
  withMockData(testFunction) {
    // We use a POJO to fake the internal storage.
    this.mockData = {
      [namespace]: {},
    };

    return async (...args) => {
      this.storePromise = Promise.resolve({
        data: this.mockData,
        saveSoon() {},
      });

      try {
        // Tests directly edit store values, so for test functions, the relevant
        // namespace is exposed for brevity.
        await testFunction(this.mockData[namespace], ...args)
      } finally {
        this.stopAllObservers();

        // Clear up any remnants from the test function
        this.clearStorage();

        // Undo the mock storage
        this.storePromise = undefined;
      }

      // ensureStorage will use the fake `storePromise`, returning mock data.
      return await this.ensureStorage();
    };
  },

  /**
   * Looks up active recipes in the local store that modify preference values,
   * and applies those changes across Default/User prefs.
   *
   * @returns {Promise}
   * @resolves When the operation is completed succesfully
   * @rejects Javascript exception.
   */
  async applyAll() {
    // On shutdown, clear all the observers that we're about to instantiate.
    CleanupManager.addCleanupHandler(this.stopAllObservers.bind(this));

    for (const recipe of await this.getActiveChanges()) {
      // Select the User or Default branch, then update the recipe's preference
      // with the appropriate value.
      const prefs = this.getPreferenceBranch(recipe.preferenceBranchType);
      prefs.set(recipe.preferenceName, recipe.preferenceValue);

      // Notify Telemetry of recipes we're running, since they don't persist between restarts
      TelemetryEnvironment.setExperimentActive(recipe.name, recipe.branch);

      // Watch for changes to the recipe's preference
      this.startObserver(recipe.name, recipe.preferenceName, recipe.preferenceValue);
    }
  },

  /**
   * Returns a reference to either the Default or User preferences branch
   *
   * @param  {string} which Branch to return ('user' or 'default')
   * @return {Object}       Selected preferences branch
   */
  getPreferenceBranch(which) {
    const branch = PreferenceBranchType[which];
    if (!branch) {
      throw new Error(`Invalid value for preference branch: "${which}"`);
    }

    return branch;
  },

  /**
   * Register a preference observer that stops an recipe when the user
   * modifies the preference.
   * @param {string} recipeName
   * @param {string} preferenceName
   * @param {string|integer|boolean} preferenceValue
   * @throws {Error}
   *   If an observer for the named recipe is already active.
   */
  startObserver(recipeName, preferenceName, preferenceValue) {
    log.debug(`PreferenceManagement.startObserver(${recipeName})`);

    if (this.preferenceObservers.has(recipeName)) {
      throw new Error(
        `An observer for the preference recipe ${recipeName} is already active.`
      );
    }

    const observerInfo = {
      preferenceName,
      observer: (newValue) => {
        if (newValue !== preferenceValue) {
          this.stop(recipeName, false);
        }
      },
    };
    this.preferenceObservers.set(recipeName, observerInfo);
    Preferences.observe(preferenceName, observerInfo.observer);
  },

  /**
   * Check if a preference observer is active for an recipe.
   * @param {string} recipeName
   * @return {Boolean}
   */
  hasObserver(recipeName) {
    log.debug(`PreferenceManagement.hasObserver(${recipeName})`);
    return this.preferenceObservers.has(recipeName);
  },

  /**
   * Disable a preference observer for the named recipe.
   * @param {string} recipeName
   * @throws {Error}
   *   If there is no active observer for the named recipe.
   */
  stopObserver(recipeName) {
    log.debug(`PreferenceManagement.stopObserver(${recipeName})`);

    if (!this.preferenceObservers.has(recipeName)) {
      throw new Error(`No observer for the preference recipe ${recipeName} found.`);
    }

    const {preferenceName, observer} = this.preferenceObservers.get(recipeName);
    Preferences.ignore(preferenceName, observer);
    this.preferenceObservers.delete(recipeName);
  },

  /**
   * Disable all currently-active preference observers for recipes.
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
   * recipe.
   * @param {string} recipeName
   * @rejects {Error}
   *   If there is no stored recipe with the given name.
   */
  async markLastSeen(recipeName) {
    log.debug(`PreferenceManagement.markLastSeen(${recipeName})`);

    const store = await this.getStorage();
    if (!(recipeName in store.data[namespace])) {
      throw new Error(`Could not find a preference recipe named "${recipeName}"`);
    }

    store.data[namespace][recipeName].lastSeen = new Date().toJSON();
    store.saveSoon();
  },

  /**
   * Given a recipe name, returns the relevant stored data, if any.
   *
   * @param  {String} recipeName
   * @resolves When the operation is completed succesfully
   * @rejects {Error}
   *   If there is no stored recipe with the given name.
   */
  async get(recipeName) {
    log.debug(`PreferenceManagement.get(${recipeName})`);
    const store = await this.getStorage();
    if (!(recipeName in store.data[namespace])) {
      throw new Error(`Could not find a preference recipe named "${recipeName}"`);
    }

    // Return a copy so mutating it doesn't affect the storage.
    return Object.assign({}, store.data[namespace][recipeName]);
  },

  /**
   * Determines if a recipe's preference type is valid, and checks that the new
   * value type matches the existing preference type (if any value exists).
   *
   * @param  {Object} recipe Recipe object to analyze
   * @throws {Error} If preference type is invalid, or doesn't match existing type.
   */
  validateRecipePrefTypes(recipe) {
    const { preferenceName, preferenceType } = recipe;

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
  },

  /**
   * Saves a recipe object into locally-namespaced storage.
   *
   * @param  {Object} recipe    Recipe data to save into storage.
   * @returns {Promise}
   * @resolves When the operation is completed succesfully
   * @rejects Javascript exception.
   */
  async saveRecipeData(recipe) {
    log.debug("PreferenceManagement.saveRecipeData()");

    const store = await this.getStorage();
    store.data[namespace][recipe.name] = recipe;
    store.saveSoon();
  },

  /**
   * Returns an array of stored recipe objects which are NOT expired.
   *
   * @returns {Promise}
   * @resolves When the operation is completed succesfully
   * @rejects Javascript exception.
   */
  async getActiveChanges() {
    log.debug("PreferenceManagement.getActiveChanges()");
    const allPrefs = await this.getStoredRecipes();
    // Return copies so mutating them doesn't affect the storage.
    return allPrefs.filter(e => !e.expired).map(e => Object.assign({}, e));
  },

  /**
   * Returns an array of stored recipe objects, both active and expired.
   *
   * @returns {Promise}
   * @resolves When the operation is completed succesfully
   * @rejects Javascript exception.
   */
  async getStoredRecipes() {
    log.debug("PreferenceManagement.getStoredRecipes()");
    const store = await this.getStorage();

    // Return copies so mutating them doesn't affect the storage.
    return Object.values(store.data[namespace]).map(e => Object.assign({}, e));
  },

  /**
   * Determines if the local storage has data for a specific recipe.
   *
   * @param  {string}  recipeName
   * @returns {Promise}
   * @resolves When the operation is completed succesfully
   * @rejects Javascript exception.
   */
  async has(recipeName) {
    log.debug(`PreferenceManagement.has(${recipeName})`);
    const store = await this.getStorage();
    return store.data[namespace].hasOwnProperty(recipeName);
  },

  /**
   * Expires a stored recipe.
   *
   * @param  {string}  recipeName
   * @returns {Promise}
   * @resolves When the operation is completed succesfully
   * @rejects Javascript exception.
   */
  async expire(recipeName) {
    log.debug(`PreferenceManagement.expire(${recipeName})`);
    const store = await this.getStorage();
    store.data[namespace][recipeName].expired = true;
  }
});
