const {Cu} = require('chrome');
Cu.importGlobalProperties(['Blob']);
Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/Preferences.jsm');
Cu.import('resource://gre/modules/Timer.jsm'); /* globals setTimeout */

const {Log} = require('./Log.js');
const {Http} = require('./Http.js');

// const STARTUP_DELAY_MS = 5000;
const STARTUP_DELAY_MS = 0;

exports.RecipeRunner = {
  init({waitForTabs: waitForTabs=true}) {
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

    if (waitForTabs) {
      // Wait for tabs to be loaded. This calls `this.observe` as callback.
      log.debug('Waiting for tabs to load');
      Services.obs.addObserver(this, 'sessionstore-windows-restored', false);
    } else {
      log.debug('Not waiting for tabs, starting immediately');
      // `setTimeout` so this is always an async action.
      setTimeout(this.start.bind(this), 0);
    }
  },

  uninit() {
    Services.obs.removeObserver(this, 'sessionstore-windows-restored');
  },

  /**
   * Handle notifications from `Services.obs.addObserver`.
   */
  observe(subject, topic, data) {
    const log = Log.makeNamespace('RecipeRunner.observe');
    if (topic === 'sessionstore-windows-restored') {
      // All tabs and windows are loaded now. Wait a bit more, just in case.
      log.debug(`Tabs are loaded, waiting ${STARTUP_DELAY_MS} and then loading recipes.`);
      setTimeout(this.start.bind(this), STARTUP_DELAY_MS);
    } else {
      log.config(`Unexpected topic: "${topic}"`, data);
    }
  },

  start() {
    const log = Log.makeNamespace('RecipeRunner.start');

    this.fetchRecipeList()
    .then(({recipes}) => {
      Log.info('recipes=');
      Log.info(recipes);
      return Promise.all(recipes.map(this.executeRecipe.bind(this)));
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
  fetchRecipeList() {
    // Fetch the Self Support URL from the preferences.
    const log = Log.makeNamespace('RecipeRunner.fetchRecipes');
    const url = Preferences.get('extensions.recipeclient.recipe_url', null);

    if (url === null) {
      log.error('Preference extensions.recipeclient.recipe_url is not defined');
      return;
    }

    if (!url.startsWith('https://')) {
      log.error(`Non HTTPS URL provided: ${url}`);
      return;
    }

    log.config(`Loading recipes from ${url}`);

    return Http.post({url, headers: {'Accept': 'application/json'}})
    .then(response => JSON.parse(response.text));
  },

  executeRecipe(recipe) {
    const log = Log.makeNamespace('RecipeRunner.executeRecipe');

    return Promise.all(recipe.actions.map(this.fetchAction.bind(this)))
    .then(actions => {
      log.info('actions=');
      log.info(actions);
      var promiseChain = Promise.resolve();
      for (let action of actions) { // eslint-disable-line prefer-const
        promiseChain = promiseChain.then(() => action());
      }
      return promiseChain;
    });
  },

  fetchAction(actionSpec) {
    const log = Log.makeNamespace('RecipeRunner.fetchAction');
    return Http.get({url: actionSpec.implementation.url})
    .then(response => {
      const sandboxScript = response.text;
      const sandbox = Cu.Sandbox(null);

      sandbox.postMessage = function(msg) {
        log.info(msg);
      }

      try {
        Cu.evalInSandbox(sandboxScript, sandbox);
        return sandbox.run;
      } catch (err) {
        log.error('failed to execute action');
        log.error(err);
        return function(){};
      }
    });
  },
};
