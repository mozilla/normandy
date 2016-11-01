/* This Source Code Form is subject to the terms of the Mozilla  * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {prefs} = require("sdk/simple-prefs");
const {Cu} = require("chrome");
Cu.import("resource://gre/modules/Preferences.jsm"); /* globals Preferences */
Cu.import("resource://gre/modules/Timer.jsm"); /* globals setTimeout */
Cu.import("resource://gre/modules/Task.jsm"); /* globals Task */

const {Log} = require("./Log.js");
const {Http} = require("./Http.js");
const {NormandyDriver} = require("./NormandyDriver.js");
const {EnvExpressions} = require("./EnvExpressions.js");
const {NormandyApi} = require("./NormandyApi.js");
const {SandboxManager} = require("../lib/SandboxManager.js");

exports.RecipeRunner = {
  init() {
    if (!this.checkPrefs()) {
      return;
    }

    let delay;
    if (prefs.dev_mode) {
      delay = 0;
    } else {
      // startup delay is in seconds
      delay = prefs.startup_delay * 1000;
    }

    setTimeout(this.start.bind(this), delay);
  },

  checkPrefs() {
    // Only run if Unified Telemetry is enabled.
    if (!Preferences.get("toolkit.telemetry.unified", false)) {
      Log.info("Disabling RecipeRunner because Unified Telemetry is disabled.");
      return false;
    }

    if (!prefs.enabled) {
      Log.info("Recipe Client is disabled.");
      return false;
    }

    if (!prefs.api_url.startsWith("https://")) {
      Log.error(`Non HTTPS URL provided: ${prefs.api_url}`);
      return false;
    }

    return true;
  },

  start: Task.async(function* () {
    let recipes;
    try {
      recipes = yield NormandyApi.fetchRecipes({enabled: true});
    } catch (e) {
      Log.error(`Could not fetch recipes from ${prefs.api_url}: "${e}"`);
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
    let response = yield Http.get({url: action.implementation_url});

    const actionScript = response.text;
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
