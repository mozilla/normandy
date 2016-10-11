const {prefs} = require('sdk/simple-prefs');
const {Cu} = require('chrome');
Cu.import('resource://gre/modules/Preferences.jsm'); /* globals Preferences */
Cu.import('resource://gre/modules/Timer.jsm'); /* globals setTimeout */
Cu.import('resource://gre/modules/Task.jsm'); /* globals Task */

const {Log} = require('./Log.js');
const {Http} = require('./Http.js');
const {NormandyDriver} = require('./NormandyDriver.js');
const {EnvExpressions} = require('./EnvExpressions.js');
const {NormandyApi} = require('./NormandyApi.js');

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
    if (!Preferences.get('toolkit.telemetry.unified', false)) {
      Log.info('Disabling RecipeRunner because Unified Telemetry is disabled.');
      return false;
    }

    if (!prefs.enabled) {
      Log.info('Recipe Client is disabled.');
      return false;
    }

    if (!prefs.api_url.startsWith('https://')) {
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
      Log.debug('No recipes to execute');
    } else {
      Log.debug(`Executing ${recipesToRun.length} recipes: ${recipesToRun.map(r => r.name).join(', ')}`);
      for (let recipe of recipesToRun) {
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
      return Promise.resolve(true);
    }
    return EnvExpressions.eval(filter, extraContext)
    .then(result => {
      return !!result;
    })
    .catch(error => {
      Log.error(`Error checking filter for "${recipe.name}"`);
      Log.error(`Filter: "${filter}"`);
      Log.error(`Error: "${error}"`);
    });
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

    let action = yield NormandyApi.fetchAction(recipe.action);
    let response = yield Http.get({url: action.implementation_url});

    const actionScript = response.text;
    const registerActionScript = `
      function registerAction(name, Action) {
        let a = new Action(sandboxedDriver, sandboxedRecipe);
        a.execute()
        .catch(err => sandboxedDriver.log(err, 'error'));
      };

      window.registerAction = registerAction;
    `;

    const driver = new NormandyDriver(this, sandbox, extraContext);
    sandbox.sandboxedDriver = Cu.cloneInto(driver, sandbox, {cloneFunctions: true});
    sandbox.sandboxedRecipe = Cu.cloneInto(recipe, sandbox);
    sandbox.window = Cu.cloneInto({}, sandbox);

    Cu.evalInSandbox(registerActionScript, sandbox);
    Cu.evalInSandbox(actionScript, sandbox);
  }),

  heartbeatNotifications: [],

  cleanup() {
    if (this.heartbeatNotifications.length) {
      this.heartbeatNotifications.forEach(heartbeat => {
        let notice = heartbeat.notificationBox.getNotificationWithValue(`heartbeat-${heartbeat.options.flowId}`);
        if (notice) {
          heartbeat.notificationBox.removeNotification(notice);
        }
      });

      this.heartbeatNotifications = [];
    }
  },
};
