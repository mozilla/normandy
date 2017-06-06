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
 *
 *   If "default", when the experiment is active, the default value for the
 *   preference is modified on startup of the add-on. If "user", the user value
 *   for the preference is modified when the experiment starts, and is reset to
 *   its original value when the experiment ends.
 */

"use strict";

const {utils: Cu} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://shield-recipe-client/lib/PreferenceManager.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "LogManager", "resource://shield-recipe-client/lib/LogManager.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "TelemetryEnvironment", "resource://gre/modules/TelemetryEnvironment.jsm");

this.EXPORTED_SYMBOLS = ["PreferenceExperiments"];

const log = LogManager.getLogger("preference-experiments");

const PREF_NAMESPACE = "experiments";

this.PreferenceExperiments = Object.assign(new PreferenceManager(PREF_NAMESPACE), {
  async init() {
    await this.applyActiveRecipes();
  },

  async getAllExperiments() {
    return await this.getStoredRecipes();
  },

  /**
   * Start a new preference experiment.
   * @param {Object} experiment
   * @param {string} experiment.name
   * @param {string} experiment.branch
   * @param {string} experiment.preferenceName
   * @param {string|integer|boolean} experiment.preferenceValue
   * @param {PreferenceBranchType} experiment.preferenceBranchType
   * @rejects {Error}
   *   - If an experiment with the given name already exists
   *   - if an experiment for the given preference is active
   *   - If the given preferenceType does not match the existing stored preference
   */
  async start({name, branch, preferenceName, preferenceValue, preferenceBranchType, preferenceType}) {
    log.debug(`PreferenceExperiments.start(${name}, ${branch})`);

    const hasExistingExperiment = await this.hasRecipe(name);
    if (hasExistingExperiment) {
      throw new Error(`A preference experiment named "${name}" already exists.`);
    }

    const activeExperiments = await this.getActiveRecipes();
    const hasConflictingExperiment = activeExperiments.some(
      e => e.preferenceName === preferenceName
    );
    if (hasConflictingExperiment) {
      throw new Error(
        `Another preference experiment for the pref "${preferenceName}" is currently active.`
      );
    }

    const preferences = this.getPreferenceBranch(preferenceBranchType);

    /** @type {Experiment} */
    const experiment = {
      name,
      branch,
      expired: false,
      lastSeen: new Date().toJSON(),
      preferenceName,
      preferenceValue,
      preferenceType,
      previousPreferenceValue: preferences.get(preferenceName, undefined),
      preferenceBranchType,
    };

    // Validation will throw if preference types associated with this recipe
    // are incompatible with the existing value type.
    this.validateRecipePrefTypes(experiment);

    // Save experiment data locally to be read from on startup later.
    this.saveRecipeData(experiment);
    this.startObserver(experiment.name, experiment.preferenceName, experiment.preferenceValue);

    // Actually alter the set preference (this is done automatically on startup).
    preferences.set(preferenceName, preferenceValue);

    // Notify Telemetry.
    TelemetryEnvironment.setExperimentActive(name, branch);
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

    const hasExistingExperiment = await this.hasRecipe(experimentName);
    if (!hasExistingExperiment) {
      throw new Error(`Could not find a preference experiment named "${experimentName}"`);
    }

    const experiment = await this.getRecipe(experimentName);
    if (experiment.expired) {
      throw new Error(
        `Cannot stop preference experiment "${experimentName}" because it is already expired`
      );
    }

    if (this.hasObserver(experimentName)) {
      this.stopObserver(experimentName);
    }

    if (resetValue) {
      const {preferenceName, previousPreferenceValue, preferenceBranchType} = experiment;

      const preferences = this.getPreferenceBranch(preferenceBranchType);

      if (previousPreferenceValue !== undefined) {
        preferences.set(preferenceName, previousPreferenceValue);
      } else {
        // This does nothing if we're on the default branch, which is fine. The
        // preference will be reset on next restart, and most preferences should
        // have had a default value set before the experiment anyway.
        preferences.reset(preferenceName);
      }
    }

    await this.expireRecipe(experiment.name);
    TelemetryEnvironment.setExperimentInactive(experimentName, experiment.branch);
  },
});
