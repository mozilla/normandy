const {Cu} = require('chrome');
Cu.import('resource://gre/modules/Preferences.jsm'); /* globals Preferences */
Cu.import('resource://gre/modules/Timer.jsm'); /* globals setTimeout */
Cu.import('resource://gre/modules/Task.jsm'); /* globals Task */

const {Log} = require('./Log.js');
const {Http} = require('./Http.js');
const {NormandyDriver} = require('./NormandyDriver.js');
const {EnvExpressions} = require('./EnvExpressions.js');
const {NormandyApi} = require('./NormandyApi.js');

// const STARTUP_DELAY_MS = 5000;
const STARTUP_DELAY_MS = 0;

exports.RecipeRunner = {
  init() {
    if (this.checkPrefs()) {
      setTimeout(this.start.bind(this), STARTUP_DELAY_MS);
    }
  },

  checkPrefs() {
    // Only run if Unified Telemetry is enabled.
    if (!Preferences.get('toolkit.telemetry.unified', false)) {
      Log.config('Disabling RecipeRunner because Unified Telemetry is disabled.');
      return false;
    }

    if (!Preferences.get('extensions.recipeclient.enabled', true)) {
      Log.config('Recipe Client is disabled.');
      return false;
    }

    const url = Preferences.get('extensions.recipeclient.api_url', null);
    if (url === null) {
      Log.error('Preference extensions.recipeclient.api_url is not defined');
      return false;
    }

    if (!url.startsWith('https://')) {
      Log.error(`Non HTTPS URL provided: ${url}`);
      return false;
    }

    return true;
  },

  start: Task.async(function* () {
    let recipes;
    try {
      recipes = yield NormandyApi.fetchRecipes({enabled: true});
    } catch (e) {
      const api_url = Preferences.get('extensions.recipeclient.api_url', null);
      Log.error(`Could not fetch recipes from ${api_url}`);
      return;
    }

    let extraContext;
    try {
      extraContext = yield this.getExtraContext();
    } catch (e) {
      extraContext = {};
    }

    for (let recipe of recipes) {
      if (yield this.checkFilter(recipe, extraContext)) {
        yield this.executeRecipe(recipe, extraContext);
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
    let filter = recipe.filter_expression;
    if (!filter || filter === '') {
      Log.debug(`recipe "${recipe.name}" has no filter expression`);
      return Promise.resolve(true);
    } else {
      return EnvExpressions.eval(filter, extraContext)
      .then(result => {
        Log.debug(`Filter for "${recipe.name}": "${filter}" -> ${result}`);
        return !!result;
      });
    }
  },

  /**
   * Execute a recipe by fetching it action and executing it.
   * @param  {Object} recipe A recipe to execute
   * @promise Resolves when the action has executed
   */
  executeRecipe: Task.async(function* (recipe, extraContext) {
    const sandbox = new Cu.Sandbox(null, {
      wantComponents: false,
      wantGlobalProperties: ['URL', 'URLSearchParams'],
    });

    sandbox.setTimeout = Cu.cloneInto(setTimeout, sandbox, {cloneFunctions: true});

    Log.debug('Loading action', recipe.action);
    let action = yield NormandyApi.fetchAction(recipe.action);

    Log.debug('Loading implementation from', action.implementation_url);
    let response = yield Http.get({url: action.implementation_url});

    Log.debug('Running action in sandbox');
    const actionScript = response.text;
    const registerActionScript = `
      function registerAction(name, Action) {
        let a = new Action(sandboxedDriver, sandboxedRecipe);
        a.execute()
        .catch(err => sandboxedDriver.log(err, 'error'));
      };

      window.registerAction = registerAction;
    `;

    const driver = new NormandyDriver(sandbox, extraContext);
    sandbox.sandboxedDriver = Cu.cloneInto(driver, sandbox, {cloneFunctions: true});
    sandbox.sandboxedRecipe = Cu.cloneInto(recipe, sandbox);
    sandbox.window = Cu.cloneInto({}, sandbox);

    Cu.evalInSandbox(registerActionScript, sandbox);
    Cu.evalInSandbox(actionScript, sandbox);
    Log.debug('Finished running action');
  }),
};
