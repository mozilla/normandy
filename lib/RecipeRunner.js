const {Cu} = require('chrome');
Cu.import('resource://gre/modules/Preferences.jsm'); /* globals Preferences */
Cu.import('resource://gre/modules/Timer.jsm'); /* globals setTimeout */

const {Log} = require('./Log.js');
const {Http} = require('./Http.js');
const {NormandyDriver} = require('./NormandyDriver.js');

// const STARTUP_DELAY_MS = 5000;
const STARTUP_DELAY_MS = 0;

exports.RecipeRunner = {
  init() {
    const log = Log.makeNamespace('RecipeRunner.init');
    // Only run if Unified Telemetry is enabled.
    if (!Preferences.get('toolkit.telemetry.unified', false)) {
      log.config('Disabling RecipeRunner because Unified Telemetry is disabled.');
      return;
    }

    if (!Preferences.get('extensions.recipeclient.enabled', true)) {
      log.config('Recipe Client is disabled.');
      return;
    }

    setTimeout(this.start.bind(this), STARTUP_DELAY_MS);
  },

  start() {
    const log = Log.makeNamespace('RecipeRunner.start');

    this.fetchBundle()
    .then(bundle => {
      let names = bundle.recipes.map(r => r.name).join(', ');
      log.info(`executing ${bundle.recipes.length} recipes: ${names}`);
      return Promise.all(bundle.recipes.map(recipe => this.executeRecipe(recipe, bundle)));
    })
    .catch(err => {
      log.error('Error executing recipes:');
      log.error(err);
    });
  },

  /**
   * Query recipe server for recipes, and execute them.
   * @return {[type]} [description]
   */
  fetchBundle() {
    // Fetch the Self Support URL from the preferences.
    const log = Log.makeNamespace('RecipeRunner.fetchRecipes');
    const url = Preferences.get('extensions.recipeclient.recipe_url', null);
    const headers = {'Accept': 'application/json'};

    if (url === null) {
      log.error('Preference extensions.recipeclient.recipe_url is not defined');
      return Promise.reject();
    }

    if (!url.startsWith('https://')) {
      log.error(`Non HTTPS URL provided: ${url}`);
      return Promise.reject();
    }

    return this.getFetchBundleData()
    .then(data => {
      log.config(`Loading recipes from ${url}`);
      return Http.post({url, headers, data});
    })
    .then(response => response.json);
  },

  getFetchBundleData() {
    return Promise.resolve({
      locale: 'en-US',
      user_id: 'mythmon',
      release_channel: 'nightly',
      version: '48.0a1',
    });
  },

  /**
   * Execute a recipe by fetching it action and executing it.
   * @param  {Object} recipe A recipe to execute
   * @promise Resolves when the action has executed
   */
  executeRecipe(recipe, bundle) {
    const log = Log.makeNamespace('RecipeRunner.executeRecipe');
    const sandbox = new Cu.Sandbox(null);

    sandbox.setTimeout = Cu.cloneInto(setTimeout, sandbox, {cloneFunctions: true});

    log.info(`Loading action implementation from ${recipe.action.implementation_url}`);
    return Http.get({url: recipe.action.implementation_url})
    .then(response => {
      const actionScript = response.text;
      const registerActionScript = `
        function registerAction(name, Action) {
          let a = new Action(sandboxedDriver, sandboxedRecipe);
          a.execute();
        };
      `;

      let driver = new NormandyDriver(sandbox, bundle.country);
      sandbox.sandboxedDriver = Cu.cloneInto(driver, sandbox, {cloneFunctions: true});
      sandbox.sandboxedRecipe = Cu.cloneInto(recipe, sandbox);

      Cu.evalInSandbox(registerActionScript, sandbox);
      Cu.evalInSandbox(actionScript, sandbox);
    });
  },
};
