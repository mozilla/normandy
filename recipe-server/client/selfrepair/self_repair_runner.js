import JexlEnvironment from 'selfrepair/JexlEnvironment';

const registeredActions = {};
window.registerAction = (name, ActionClass) => {
  registeredActions[name] = ActionClass;
};


/**
 * Download the implementation of the given action from the server.
 *
 * @param {Action} action Action object from the server.
 * @promise {Function} The action class for the given recipe's action.
 * @rejects {Error} Rejects if the action could not be loaded or did not
 *     register itself.
 */
export function loadActionImplementation(action) {
  const cache = loadActionImplementation._cache;

  if (!(action.name in cache)) {
    cache[action.name] = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = action.implementation_url;
      script.onload = () => {
        if (!(action.name in registeredActions)) {
          reject(new Error(`Could not find action with name ${action.name}.`));
        } else {
          resolve(registeredActions[action.name]);
        }
      };
      document.head.appendChild(script);
    });
  }

  return cache[action.name];
}
loadActionImplementation._cache = {};


/**
 * Fetch an action object from the server for the given recipe.
 *
 * @param {Recipe} recipe Recipe object from the server.
 * @promise {Action} The Action object from the server.
 */
export function fetchAction(recipe) {
  const cache = fetchAction._cache;

  if (!(recipe.action in cache)) {
    const headers = { Accept: 'application/json' };
    cache[recipe.action] = fetch(`/api/v1/action/${recipe.action}/`, { headers })
      .then(response => response.json());
  }

  return cache[recipe.action];
}
fetchAction._cache = {};

/**
 * Fetch all enabled recipes from the server.
 * @promise Resolves with a list of all enabled recipes.
 */
export function fetchRecipes() {
  const { recipeUrl } = document.documentElement.dataset;
  const headers = { Accept: 'application/json' };

  return fetch(`${recipeUrl}?enabled=true`, { headers })
  .then(response => response.json());
}


/**
 * Fetch client information from the Normandy server.
 * @promise Resolves with an object containing client info.
 */
export function classifyClient() {
  let { classifyUrl } = document.documentElement.dataset;
  const headers = { Accept: 'application/json' };

  classifyUrl = new URL(classifyUrl, window.location.href);

  return fetch(classifyUrl.href, { headers })
  .then(response => response.json())
  .then(classification => {
    // Parse request time
    classification.request_time = new Date(classification.request_time);
    return classification;
  });
}


/**
 * Fetch and execute the actions for the given recipe.
 *
 * @param {Recipe} recipe - Recipe retrieved from the server.
 * @promise Resolves once the action has executed.
 */
export async function runRecipe(recipe, driver, options = {}) {
  const action = await fetchAction(recipe);
  const ActionImplementation = await loadActionImplementation(action);
  if (options.testing !== undefined) {
    driver.testing = options.testing;
  }

  return new ActionImplementation(driver, recipe).execute();
}


/**
 * Generate a context object for JEXL filter expressions.
 * @return {object}
 */
export async function filterContext(driver) {
  const classification = await classifyClient();
  const client = await driver.client();

  return {
    normandy: {
      locale: driver.locale,
      userId: driver.userId,
      ...client,
      ...classification,
    },
  };
}


/**
 * Match a recipe against a context using its filter expression.
 * @param  {Recipe} recipe  Recipe fetched from the server.
 * @param  {object} context Context returned by filterContext.
 * @promise Resolves with a list containing the recipe and a boolean
 *     signifying if the filter passed or failed.
 */
export function doesRecipeMatch(recipe, context) {
  const jexlEnv = new JexlEnvironment({ recipe, ...context });
  return jexlEnv.eval(recipe.filter_expression).then(value => [recipe, !!value]);
}
