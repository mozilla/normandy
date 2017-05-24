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
XPCOMUtils.defineLazyModuleGetter(this, "PreferenceManagement", "resource://shield-recipe-client/lib/PreferenceManagement.jsm");

this.EXPORTED_SYMBOLS = ["PreferenceRollout"];

const log = LogManager.getLogger("preference-rollouts");

const PREF_NAMESPACE = "rollouts";

this.PreferenceRollout = Object.assign({}, PreferenceManagement(PREF_NAMESPACE), {
  async init() {
    this.applyAll();
  },

  async start({name, preferenceName, preferenceValue, preferenceBranch, preferenceType}) {
    log.debug(`PreferenceRollout.enroll(${name} - ${preferenceBranch}/${preferenceName})`);

    const hasExistingRollout = await this.has(name);
    if (hasExistingRollout) {
      throw new Error(`A preference rollout named "${name}" already exists.`);
    }

    /** @type {Experiment} */
    const experiment = {
      name,
      preferenceName,
      preferenceValue,
      preferenceType,
      preferenceBranch,
      branch: preferenceBranch,
    };

    const preferences = this.getPreferenceBranch(preferenceBranch);

    // 'User' branch prefs are saved locally, so in the event the user is withdrawn
    // from the rollout, the pref can be reset to what the user had originally.
    // (Default branch pref rollouts simply unset the value and let the browser
    // set its baked-in default value, so we don't need to store it.)
    if (preferenceBranch === "user") {
      const store = await this.getStorage();
      store.data[PREF_NAMESPACE][name] = preferences.get(preferenceName);
      store.saveSoon();
    }

    // Validation will throw
    this.validateRecipePrefTypes(experiment);

    // Save experiment data locally to be read from on startup later
    this.saveRecipeData(experiment);
    this.startObserver(experiment.name, experiment.preferenceName, experiment.preferenceValue);

    // Actually alter the set preference (later, this is done automatically on startup)
    preferences.set(preferenceName, preferenceValue);
  },

  /**
   * Stubbed withdraw function
   */
  async stop(rolloutName, resetValue = true) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  },
});
