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

    this.registeredObserver = false;

    if (waitForTabs) {
      // Wait for tabs to be loaded. This calls `this.observe` as callback.
      log.debug('Waiting for tabs to load');
      Services.obs.addObserver(this, 'sessionstore-windows-restored', false);
      this.registeredObserver = true;
    } else {
      log.debug('Not waiting for tabs, starting immediately');
      // `setTimeout` so this is always an async action.
      setTimeout(this.start.bind(this), 0);
    }
  },

  uninit() {
    if (this.registeredObserver) {
      Services.obs.removeObserver(this, 'sessionstore-windows-restored');
    }
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
      return Promise.reject();
    }

    if (!url.startsWith('https://')) {
      log.error(`Non HTTPS URL provided: ${url}`);
      return Promise.reject();
    }

    log.config(`Loading recipes from ${url}`);

    return Http.post({url, headers: {'Accept': 'application/json'}})
    .then(response => JSON.parse(response.text));
  },

  /**
   * Execute a recipe by fetching all of it's actions and executing them.
   * @param  {[type]} recipe [description]
   * @return {[type]}        [description]
   */
  executeRecipe(recipe) {
    const log = Log.makeNamespace('RecipeRunner.executeRecipe');
    return Promise.all(recipe.actions.map(this.fetchAction.bind(this)))
    .then(actions => {
      var promiseChain = Promise.resolve();
      for (let action of actions) { // eslint-disable-line prefer-const
        promiseChain = promiseChain.then(() => {
          try {
            action();
          } catch (err) {
            log.info(action);
            log.error(err);
            throw err;
          }
        });
      }
      return promiseChain;
    });
  },

  /**
   * Fetch an action, returning a function that has any needed arguments
   * bound to it.
   * @param {Object} actionSpec [description]
   * @param {String} actionSpec.implentation.url The url the implementation
   *   can be found at
   * @param {String} actionSpec.name The name of the action
   * @param {Object} actionSpec.arguments The arguments the action should take.
   * @return {Function} A function that takes no parameters.
   */
  fetchAction(actionSpec) {
    // TODO: Break this up a lot, it is really big. Probably move
    // `initializationNormandy` and `runTimeNormandy` into another file
    // and separate loading the action from building the action wrapper.

    const log = Log.makeNamespace('RecipeRunner.fetchAction');
    return Http.get({url: actionSpec.implementation.url})
    .then(response => {
      const sandboxScript = response.text;
      const sandbox = Cu.Sandbox(null);

      let actionImpl = null;

      const initializationNormandy = {
        registerAction: function(name, func) {
          if (actionImpl !== null) {
            throw new Error(`Multiple actions registered in ${actionSpec.name}`);
          }
          if (name !== actionSpec.name) {
            throw new Error('Unexpected action registered. ' +
                            `Found ${name}, expected ${actionSpec.name}`);
          }
          actionImpl = func;
        },
      };

      const runtimeNormandy = {};

      sandbox.Normandy = Cu.cloneInto(initializationNormandy, sandbox, {
        cloneFunctions: true,
      });
      const console_ = {
        log: function(...args) {
          Log.info(`RecipeRunner action ${actionSpec.name}: "${args.join(' ')}"`);
        },
      };
      sandbox.console = Cu.cloneInto(console_, sandbox, {
        cloneFunctions: true,
      });

      try {
        Cu.evalInSandbox(sandboxScript, sandbox);
      } catch (err) {
        log.error('failed to execute actionImpl');
        log.error(err);
      }

      if (actionImpl === null) {
        throw new Error(`No actionImpl was registered in ${actionSpec.name}`);
      }

      const sandboxedArgs = Cu.cloneInto(actionSpec.arguments, sandbox);
      const sandboxedNormandy = Cu.cloneInto(runtimeNormandy, sandbox);
      return function() {
        actionImpl(sandboxedNormandy, sandboxedArgs);
      };
    });
  },
};
