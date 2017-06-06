/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Preference Rollouts permanently change a preference on either the User or Default
 * preference branch. Info on active and past experiments is stored in a JSON
 * file in the profile.
 *
 * Active preference rollouts are stopped if they aren't active on the recipe
 * server. They also expire if Firefox isn't able to contact the recipe server
 * after a period of time.
 */

"use strict";

const {utils: Cu} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://shield-recipe-client/lib/PreferenceManager.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "LogManager", "resource://shield-recipe-client/lib/LogManager.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "TelemetryEnvironment", "resource://gre/modules/TelemetryEnvironment.jsm");

this.EXPORTED_SYMBOLS = ["PreferenceRollout"];

const log = LogManager.getLogger("preference-rollouts");

const PREF_NAMESPACE = "rollouts";

this.PreferenceRollout = Object.assign(new PreferenceManager(PREF_NAMESPACE), {
  async init() {
    this.applyActiveRecipes();
  },

  /**
   * Register a Preference Rollout recipe and apply its preference change.
   *
   * @param  {Object} recipe
   * @param  {string} recipe.name
   * @param  {string} recipe.preferenceName   Preference the rollout will change.
   * @param  {string|integer|boolean} recipe.preferenceValue
   * @param  {string|integer|boolean} recipe.preferenceType
   * @param  {PreferenceBranchType}   recipe.preferenceBranchType   "user" or "default"
   * @rejects {Error}
   *   - If a rollout with the given name already exists
   *   - If a rollout for the given preference is active
   *   - If the given preferenceType does not match the existing stored preference
   */
  async start({name, preferenceName, preferenceValue, preferenceBranchType, preferenceType}) {
    log.debug(`PreferenceRollout.enroll(${name} - ${preferenceBranchType}/${preferenceName})`);

    const hasExistingRollout = await this.hasRecipe(name);
    if (hasExistingRollout) {
      throw new Error(`A preference rollout named "${name}" already exists.`);
    }

    /** @type {Recipe} */
    const recipe = {
      name,
      expired: false,
      lastSeen: new Date().toJSON(),
      preferenceName,
      preferenceValue,
      preferenceType,
      preferenceBranchType,
    };

    const preferences = this.getPreferenceBranch(preferenceBranchType);

    // 'User' branch prefs are saved locally, so in the event the user is withdrawn
    // from the rollout, the pref can be reset to what the user had originally.
    // (Default branch pref rollouts simply unset the value and let the browser
    // set its baked-in default value, so we don't need to store it.)
    if (preferenceBranchType === "user") {
      const store = await this.getStorage();
      store.data[PREF_NAMESPACE][name] = preferences.get(preferenceName);
      store.saveSoon();
    }

    // Validation will throw if preference types associated with this recipe
    // are incompatible with the existing value type.
    this.validateRecipePrefTypes(recipe);

    // Save recipe data locally to be read from on startup later.
    this.saveRecipeData(recipe);
    this.startObserver(recipe.name, recipe.preferenceName, recipe.preferenceValue);

    // Actually alter the set preference (later, this is done automatically on startup).
    preferences.set(preferenceName, preferenceValue);
  },
});
