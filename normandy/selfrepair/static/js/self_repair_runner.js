import Mozilla from './uitour.js'
import Normandy from './normandy_driver.js'
import uuid from 'node-uuid'
import jexl from 'jexl'


jexl.addTransform('date', value => new Date(value));


let registeredActions = {};
window.registerAction = function(name, ActionClass) {
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
        let action_name = recipe.action;
        if (!registeredActions[action_name]) {
            fetch(`/api/v1/action/${action_name}/`)
            .then(response => response.json())
            .then(action => {
                let script = document.createElement('script');
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
            resolve(registeredActions[action_name]);
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
    let {recipeUrl} = document.documentElement.dataset;
    let headers = {Accept: 'application/json'};
    let data = {enabled: 'True'}

    return fetch(recipeUrl, {headers, data})
    .then(response => response.json())
    .then(recipes => recipes);
}


/**
 * Fetch client information from the Normandy server and the driver.
 * @promise Resolves with an object containing client info.
 */
function classifyClient() {
    let {classifyUrl} = document.documentElement.dataset;
    let headers = {Accept: 'application/json'};
    let classifyXhr = fetch(classifyUrl, {headers})
    .then(response => response.json())
    .then(client => client);

    return Promise.all([classifyXhr, Normandy.client()])
    .then(([classification, client]) => {
        // Parse request time
        classification.request_time = new Date(classification.request_time)

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
export function runRecipe(recipe, options={}) {
    return loadAction(recipe).then(function(Action) {
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
    .then(classifiedClient => {
        return {
            normandy: classifiedClient
        }
    });
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
    let filter_expression = recipe.filter_expression.replace(/\r?\n|\r/g, '');

    return jexl.eval(filter_expression, context)
    .then(value => [recipe, !!value]);
}
