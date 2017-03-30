/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {utils: Cu} = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://shield-recipe-client/lib/LogManager.jsm");
Cu.import("resource://shield-recipe-client/lib/NormandyDriver.jsm");
Cu.import("resource://shield-recipe-client/lib/FilterExpressions.jsm");
Cu.import("resource://shield-recipe-client/lib/NormandyApi.jsm");
Cu.import("resource://shield-recipe-client/lib/SandboxManager.jsm");
Cu.import("resource://shield-recipe-client/lib/ClientEnvironment.jsm");
Cu.import("resource://shield-recipe-client/lib/CleanupManager.jsm");
Cu.import("resource://shield-recipe-client/lib/ActionSandboxManager.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.importGlobalProperties(["fetch"]); /* globals fetch */

XPCOMUtils.defineLazyModuleGetter(this, "Preferences", "resource://gre/modules/Preferences.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "Storage",
                                  "resource://shield-recipe-client/lib/Storage.jsm");
XPCOMUtils.defineLazyServiceGetter(this, "timerManager",
                                   "@mozilla.org/updates/timer-manager;1",
                                   "nsIUpdateTimerManager");

this.EXPORTED_SYMBOLS = ["RecipeRunner"];

const log = LogManager.getLogger("recipe-runner");
const prefs = Services.prefs.getBranch("extensions.shield-recipe-client.");
const TIMER_NAME = "recipe-client-addon-run";
const RUN_INTERVAL_PREF = "run_interval_seconds";

this.RecipeRunner = {
  init() {
    if (!this.checkPrefs()) {
      return;
    }

    const durabilityManager = new SandboxManager();
    Storage.seedDurability(durabilityManager.sandbox);

    if (prefs.getBoolPref("dev_mode")) {
      // Run right now in dev mode
      this.run();
    }

    this.updateRunInterval();
    CleanupManager.addCleanupHandler(() => timerManager.unregisterTimer(TIMER_NAME));

    // Watch for the run interval to change, and re-register the timer with the new value
    prefs.addObserver(RUN_INTERVAL_PREF, this, false);
    CleanupManager.addCleanupHandler(() => prefs.removeObserver(RUN_INTERVAL_PREF, this));
  },

  checkPrefs() {
    // Only run if Unified Telemetry is enabled.
    if (!Services.prefs.getBoolPref("toolkit.telemetry.unified")) {
      log.info("Disabling RecipeRunner because Unified Telemetry is disabled.");
      return false;
    }

    if (!prefs.getBoolPref("enabled")) {
      log.info("Recipe Client is disabled.");
      return false;
    }

    const apiUrl = prefs.getCharPref("api_url");
    if (!apiUrl || !apiUrl.startsWith("https://")) {
      log.error(`Non HTTPS URL provided for extensions.shield-recipe-client.api_url: ${apiUrl}`);
      return false;
    }

    return true;
  },

  /**
   * Watch for preference changes from Services.pref.addObserver.
   */
  observe(changedPrefBranch, action, changedPref) {
    if (action === "nsPref:changed" && changedPref === RUN_INTERVAL_PREF) {
      this.updateRunInterval();
    } else {
      log.debug(`Observer fired with unexpected pref change: ${action} ${changedPref}`);
    }
  },

  updateRunInterval() {
    // Run once every `runInterval` wall-clock seconds. This is managed by setting a "last ran"
    // timestamp, and running if it is more than `runInterval` seconds ago. Even with very short
    // intervals, the timer will only fire at most once every few minutes.
    const runInterval = prefs.getIntPref(RUN_INTERVAL_PREF);
    timerManager.registerTimer(TIMER_NAME, () => this.run(), runInterval);
  },

  async run() {
    this.clearCaches();
    // Unless lazy classification is enabled, prep the classify cache.
    if (!Preferences.get("extensions.shield-recipe-client.experiments.lazy_classify", false)) {
      await ClientEnvironment.getClientClassification();
    }

    // Run pre-execution hooks. If a hook fails, we don't run recipes with that
    // action to avoid inconsistencies.
    const actions = await NormandyApi.fetchActions();
    for (const action of Object.values(actions)) {
      try {
        await this.runActionCallback(action, "preExecution");
        action.failed = false;
      } catch (err) {
        log.error(`Could not run pre-execution hook for ${action.name}:`, err.message);
        action.failed = true;
      }
    }

    // Fetch recipes from the API
    let recipes;
    try {
      recipes = await NormandyApi.fetchRecipes({enabled: true});
    } catch (e) {
      const apiUrl = prefs.getCharPref("api_url");
      log.error(`Could not fetch recipes from ${apiUrl}: "${e}"`);
      return;
    }

    // Evaluate recipe filters
    const recipesToRun = [];
    for (const recipe of recipes) {
      if (await this.checkFilter(recipe)) {
        recipesToRun.push(recipe);
      }
    }

    // Execute recipes, if we have any.
    if (recipesToRun.length === 0) {
      log.debug("No recipes to execute");
    } else {
      for (const recipe of recipesToRun) {
        const action = actions[recipe.action];
        if (!action) {
          log.error(
            `Could not execute recipe ${recipe.name}:`,
            `Server reported no action with the name ${recipe.action}`
          );
        } else if (action.failed) {
          log.warn(
            `Skipping recipe ${recipe.name} because ${action.name} failed during pre-execution.`
          );
        } else {
          try {
            log.info(`Executing recipe "${recipe.name}" (action=${recipe.action})`);
            await this.runActionCallback(action, "action", recipe);
          } catch (e) {
            log.error(`Could not execute recipe ${recipe.name}:`, e);
          }
        }
      }
    }

    // Run post-execution hooks
    for (const action of Object.values(actions)) {
      // Skip if pre-execution failed.
      if (action.failed) {
        log.info(`Skipping post-execution hook for ${action.name} due to earlier failure.`);
        continue;
      }

      try {
        await this.runActionCallback(action, "postExecution");
      } catch (err) {
        log.info(`Could not run post-execution hook for ${action.name}:`, err.message);
      }
    }
  },

  getFilterContext(recipe) {
    return {
      normandy: Object.assign(ClientEnvironment.getEnvironment(), {
        recipe: {
          id: recipe.id,
          arguments: recipe.arguments,
        },
      }),
    };
  },

  /**
   * Evaluate a recipe's filter expression against the environment.
   * @param {object} recipe
   * @param {string} recipe.filter The expression to evaluate against the environment.
   * @return {boolean} The result of evaluating the filter, cast to a bool, or false
   *                   if an error occurred during evaluation.
   */
  async checkFilter(recipe) {
    const context = this.getFilterContext(recipe);
    try {
      const result = await FilterExpressions.eval(recipe.filter_expression, context);
      return !!result;
    } catch (err) {
      log.error(`Error checking filter for "${recipe.name}"`);
      log.error(`Filter: "${recipe.filter_expression}"`);
      log.error(`Error: "${err}"`);
      return false;
    }
  },

  /**
   * Execute a named callback in a sandbox that is registered by an action.
   * @param {Object} action
   * @param {String} callbackName
   * @promise Resolves when the callback has executed.
   */
  async runActionCallback(action, callbackName, ...args) {
    log.debug(`runActionCallback(${action.name}, callbackName)`);
    const response = await fetch(action.implementation_url);
    const actionScript = await response.text();

    const sandboxManager = new ActionSandboxManager();
    sandboxManager.addHold("callbackExecution");
    try {
      await sandboxManager.runAsyncCallbackFromScript(actionScript, callbackName, ...args);
    } finally {
      sandboxManager.removeHold("callbackExecution");
    }
  },

  /**
   * Clear all caches of systems used by RecipeRunner, in preparation
   * for a clean run.
   */
  clearCaches() {
    ClientEnvironment.clearClassifyCache();
    NormandyApi.clearIndexCache();
  },

  /**
   * Clear out cached state and fetch/execute recipes from the given
   * API url. This is used mainly by the mock-recipe-server JS that is
   * executed in the browser console.
   */
  async testRun(baseApiUrl) {
    const oldApiUrl = prefs.getCharPref("api_url");
    prefs.setCharPref("api_url", baseApiUrl);

    try {
      Storage.clearAllStorage();
      this.clearCaches();
      await this.run();
    } finally {
      prefs.setCharPref("api_url", oldApiUrl);
      this.clearCaches();
    }
  },
};
