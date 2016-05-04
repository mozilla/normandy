import 'babel-polyfill'
import xhr from './xhr.js'
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
        let action = recipe.action;
        if (!registeredActions[action.name]) {
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
        } else {
            resolve(registeredActions[action.name]);
        }
    });
}


/**
 * Get a user id. If one doesn't exist yet, make one up and store it in local storage.
 * @return {String} A stored or generated UUID
 */
function getUserId() {
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
function fetchRecipes() {
    let {recipeUrl} = document.documentElement.dataset;
    let headers = {Accept: 'application/json'};
    let data = {enabled: 'True'}

    return xhr.get(recipeUrl, {headers, data})
    .then(request => JSON.parse(request.responseText));
}


/**
 * Fetch client information from the Normandy server and the driver.
 * @promise Resolves with an object containing client info.
 */
function classifyClient() {
    let {classifyUrl} = document.documentElement.dataset;
    let headers = {Accept: 'application/json'};
    let classifyXhr = xhr.get(classifyUrl, {headers})
    .then(request => JSON.parse(request.responseText));

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
function runRecipe(recipe) {
    return loadAction(recipe).then(function(Action) {
        return new Action(Normandy, recipe).execute();
    });
}


/**
 * Generate a context object for JEXL filter expressions.
 * @return {object}
 */
function filterContext() {
    return {
        normandy: classifyClient(),
        telemetry: {},
        events: {},
    }
}


/**
 * Match a recipe against a context using its filter expression.
 * @param  {Recipe} recipe  Recipe fetched from the server.
 * @param  {object} context Context returned by filterContext.
 * @promise Resolves with a list containing the recipe and a boolean
 *     signifying if the filter passed or failed.
 */
function matches(recipe, context) {
    // Remove newlines, which are invalid in JEXL
    let filter_expression = recipe.filter_expression.replace(/\r?\n|\r/g, '');

    return jexl.eval(filter_expression, context)
    .then(value => [recipe, !!value]);
}


// Actually fetch and run the recipes.
fetchRecipes().then(recipes => {
    let context = filterContext();

    // Update Normandy driver with user's country.
    Normandy._location.countryCode = context.normandy.country;

    for (let recipe of recipes) {
        matches(recipe, context).then(([recipe, match]) => {
            if (match) {
                runRecipe(recipe).catch(err => {
                    console.error(err);
                });
            }
        });
    }
}).catch((err) => {
    console.error(err);
});
