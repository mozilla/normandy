/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


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

this.EXPORTED_SYMBOLS = ["PreferenceRollout"];

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

const log = LogManager.getLogger("preference-rollout");

/**
 * Asynchronously load the JSON file that stores rollout status in the profile.
 */
const ROLLOUT_FILE = "shield-preference-rollout.json";
let storePromise;
function ensureStorage() {
  if (storePromise === undefined) {
    const path = OS.Path.join(OS.Constants.Path.profileDir, ROLLOUT_FILE);
    const storage = new JSONFile({path});
    storePromise = storage.load().then(() => storage);
  }
  return storePromise;
}

this.PreferenceRollout = {
  async register({name, preferenceName, preferenceValue, preferenceBranch, preferenceType}) {
    log.debug(`PreferenceRollout.enroll(${name} - ${preferenceBranch}/${preferenceName})`);

    const preferences = PreferenceBranchType[preferenceBranch];
    if (!preferences) {
      throw new Error(`Invalid value for preferenceBranch: ${preferenceBranch}`);
    }
    const store = await ensureStorage();

    if (store.data[name]) {
      log.warn(`Rollout "${name}" already exists.`);
      return;
    }

    /** @type {Experiment} */
    const experiment = {
      name,
      preferenceName,
      preferenceValue,
      preferenceType,
      preferenceBranch,
    };

    // 'User' branch prefs are saved locally, so in the event the user is withdrawn
    // from the rollout, the pref can be reset to what the user had originally.
    // (Default branch pref rollouts simply unset the value and let the browser
    // set its baked-in default value, so we don't need to store it.)
    if (preferenceBranch === "user") {
      store.data[name] = Object.assign({}, experiment, {
        prevValue: preferences.get(experiment.preferenceName, undefined),
      });
      store.saveSoon();
    }

    // Set the preference to whatever the experiment requires
    preferences.set(experiment.preferenceName, experiment.preferenceValue);
  },

  /**
   * Stubbed withdraw function
   */
  async withdraw(rolloutName, resetValue = true) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  },
};
