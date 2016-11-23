/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {utils: Cu} = Components;
Cu.import("resource://gre/modules/Preferences.jsm");
Cu.import("resource://gre/modules/Timer.jsm"); /* globals setTimeout */
Cu.import("resource://gre/modules/Task.jsm");
Cu.import("resource://shield-recipe-client/lib/Log.jsm");
Cu.import("resource://shield-recipe-client/lib/NormandyDriver.jsm");
Cu.import("resource://shield-recipe-client/lib/EnvExpressions.jsm");
Cu.import("resource://shield-recipe-client/lib/NormandyApi.jsm");
Cu.import("resource://shield-recipe-client/lib/SandboxManager.jsm");

this.EXPORTED_SYMBOLS = ["RecipeRunner"];

const PREF_API_URL = "extensions.shield-recipe-client@mozilla.org.api_url";
const PREF_DEV_MODE = "extensions.shield-recipe-client@mozilla.org.dev_mode";
const PREF_ENABLED = "extensions.shield-recipe-client@mozilla.org.enabled";
const PREF_STARTUP_DELAY = "extensions.shield-recipe-client@mozilla.org.startup_delay";

this.RecipeRunner = {
  init() {
    if (!this.checkPrefs()) {
      return;
    }

    let delay;
    if (Preferences.get(PREF_DEV_MODE)) {
      delay = 0;
    } else {
      // startup delay is in seconds
      delay = Preferences.get(PREF_STARTUP_DELAY) * 1000;
    }

    setTimeout(this.start.bind(this), delay);
  },

  checkPrefs() {
    // Only run if Unified Telemetry is enabled.
    if (!Preferences.get("toolkit.telemetry.unified", false)) {
      Log.info("Disabling RecipeRunner because Unified Telemetry is disabled.");
      return false;
    }

    if (Preferences.get(PREF_ENABLED)) {
      Log.info("Recipe Client is disabled.");
      return false;
    }

    const apiUrl = Preferences.get(PREF_API_URL, '');
    if (!apiUrl.startsWith("https://")) {
      Log.error(`Non HTTPS URL provided: ${apiUrl}`);
      return false;
    }

    return true;
  },

  start: Task.async(function* () {
    let recipes;
    try {
      recipes = yield NormandyApi.fetchRecipes({enabled: true});
    } catch (e) {
      const apiUrl = Preferences.get(PREF_API_URL);
      Log.error(`Could not fetch recipes from ${apiUrl}: "${e}"`);
      return;
    }

    let extraContext;
    try {
      extraContext = yield this.getExtraContext();
    } catch (e) {
      Log.warning(`Couldn't get extra filter context: ${e}`);
      extraContext = {};
    }

    const recipesToRun = [];

    for (let recipe of recipes) {
      if (yield this.checkFilter(recipe, extraContext)) {
        recipesToRun.push(recipe);
      }
    }

    if (recipesToRun.length === 0) {
      Log.debug("No recipes to execute");
    } else {
      for (let recipe of recipesToRun) {
        try {
          Log.debug(`Executing recipe "${recipe.name}" (action=${recipe.action})`);
          yield this.executeRecipe(recipe, extraContext);
        } catch (e) {
          Log.error(`Could not execute recipe ${recipe.name}:`, e);
        }
      }
    }
  }),

  getExtraContext() {
    return NormandyApi.classifyClient()
      .then(clientData => ({normandy: clientData}));
  },

  /**
   * Evaluate a recipe's filter expression against the environment.
   * @param {object} recipe
   * @param {string} recipe.filter The expression to evaluate against the environment.
   * @param {object} extraContext Any extra context to provide to the filter environment.
   * @return {boolean} The result of evaluating the filter, cast to a bool.
   */
  checkFilter(recipe, extraContext) {
    return EnvExpressions.eval(recipe.filter_expression, extraContext)
      .then(result => {
        return !!result;
      })
      .catch(error => {
        Log.error(`Error checking filter for "${recipe.name}"`);
        Log.error(`Filter: "${recipe.filter_expression}"`);
        Log.error(`Error: "${error}"`);
      });
  },

  /**
   * Execute a recipe by fetching it action and executing it.
   * @param  {Object} recipe A recipe to execute
   * @promise Resolves when the action has executed
   */
  executeRecipe: Task.async(function* (recipe, extraContext) {
    const sandboxManager = new SandboxManager();
    const {sandbox} = sandboxManager;

    let action = yield NormandyApi.fetchAction(recipe.action);
    let response = yield fetch(action.implementation_url);

    const actionScript = yield response.text();
    const prepScript = `
      var pendingAction = null;

      function registerAction(name, Action) {
        let a = new Action(sandboxedDriver, sandboxedRecipe);
        pendingAction = a.execute()
          .catch(err => sandboxedDriver.log(err, 'error'));
      };

      window.registerAction = registerAction;
      window.setTimeout = sandboxedDriver.setTimeout;
      window.clearTimeout = sandboxedDriver.clearTimeout;
    `;

    const driver = new NormandyDriver(sandboxManager, extraContext);
    sandbox.sandboxedDriver = Cu.cloneInto(driver, sandbox, {cloneFunctions: true});
    sandbox.sandboxedRecipe = Cu.cloneInto(recipe, sandbox);

    Cu.evalInSandbox(prepScript, sandbox);
    Cu.evalInSandbox(actionScript, sandbox);

    sandboxManager.addHold("recipeExecution");
    sandbox.pendingAction.then(() => sandboxManager.removeHold("recipeExecution"));
  }),
};
