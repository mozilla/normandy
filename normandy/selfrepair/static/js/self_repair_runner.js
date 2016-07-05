import Normandy from './normandy_driver.js';
import uuid from 'node-uuid';
import jexl from 'jexl';


jexl.addTransform('date', value => new Date(value));


const registeredActions = {};
window.registerAction = (name, ActionClass) => {
  registeredActions[name] = ActionClass;
};


/**
 * Download the implementation of the given action from the server.
 *
 * @param {Recipe} recipe Recipe object from the server.
 * @promise {Function} The action class for the given recipe's action.
 * @rejects {Error} Rejects if the action could not be loaded or did not
 *     register itself.
 */
function loadAction(recipe) {
  return new Promise((resolve, reject) => {
    const actionName = recipe.action;
    if (!registeredActions[actionName]) {
      fetch(`/api/v1/action/${actionName}/`)
            .then(response => response.json())
            .then(action => {
              const script = document.createElement('script');
              script.src = action.implementation_url;
              script.onload = () => {
                if (!registeredActions[action.name]) {
                  reject(new Error(`Could not find action with name ${action.name}.`));
                } else {
                  resolve(registeredActions[action.name]);
                }
              };
              document.head.appendChild(script);
            });
    } else {
      resolve(registeredActions[actionName]);
    }
  });
}


/**
 * Get a user id. If one doesn't exist yet, make one up and store it in local storage.
 * @return {String} A stored or generated UUID
 */
export function getUserId() {
  let userId = localStorage.getItem('userId');
  if (userId === null) {
    userId = uuid.v4();
    localStorage.setItem('userId', userId);
  }
  return userId;
}


/**
 * Fetch all enabled recipes from the server.
 * @promise Resolves with a list of all enabled recipes.
 */
export function fetchRecipes() {
  const { recipeUrl } = document.documentElement.dataset;
  const headers = { Accept: 'application/json' };
  const data = { enabled: 'True' };

  return fetch(recipeUrl, { headers, data })
    .then(response => response.json())
    .then(recipes => recipes);
}


/**
 * Fetch client information from the Normandy server and the driver.
 * @promise Resolves with an object containing client info.
 */
function classifyClient() {
  const { classifyUrl } = document.documentElement.dataset;
  const headers = { Accept: 'application/json' };
  const classifyXhr = fetch(classifyUrl, { headers })
    .then(response => response.json())
    .then(client => client);

  return Promise.all([classifyXhr, Normandy.client()])
    .then(([classification, client]) => {
        // Parse request time
      classification.request_time = new Date(classification.request_time);

      return Object.assign({
        locale: Normandy.locale,
      }, classification, client);
    });
}


/**
 * Fetch and execute the actions for the given recipe.
 *
 * @param {Recipe} recipe - Recipe retrieved from the server.
 * @promise Resolves once the action has executed.
 */
export function runRecipe(recipe, options = {}) {
  return loadAction(recipe).then(Action => {
    if (options.testing !== undefined) {
      Normandy.testing = options.testing;
    }

    return new Action(Normandy, recipe).execute();
  });
}


/**
 * Generate a context object for JEXL filter expressions.
 * @return {object}
 */
export function filterContext() {
  return classifyClient()
  .then(classifiedClient => ({
    normandy: classifiedClient,
  }));
}


/**
 * Match a recipe against a context using its filter expression.
 * @param  {Recipe} recipe  Recipe fetched from the server.
 * @param  {object} context Context returned by filterContext.
 * @promise Resolves with a list containing the recipe and a boolean
 *     signifying if the filter passed or failed.
 */
export function doesRecipeMatch(recipe, context) {
    // Remove newlines, which are invalid in JEXL
  const filterExpression = recipe.filterExpression.replace(/\r?\n|\r/g, '');

  return jexl.eval(filterExpression, context)
    .then(value => [recipe, !!value]);
}
