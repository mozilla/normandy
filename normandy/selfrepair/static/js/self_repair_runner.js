import xhr from './xhr.js'
import Mozilla from './uitour.js'
import Normandy from './normandy_driver.js'

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
 * @promise {Object} The data to send to fetch_bundle to identify this client.
 */
function getFetchRecipePayload() {
    let data = {
        locale: document.documentElement.dataset.locale,
        user_id: getUserId(),
        release_channel: null,
        version: null,
    };

    return getUitourAppinfo()
    .then(uitourData => {
        data.release_channel = uitourData.defaultUpdateChannel;
        data.version = uitourData.version;
        return data;
    });
}

/**
 * @promise {Object} The appinfo from UITour
 */
function getUitourAppinfo() {
    return new Promise((resolve, reject) => {
        Mozilla.UITour.getConfiguration('appinfo', appinfo => {
            resolve(appinfo);
        });
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
 * Fetch recipes from the Recipe server.
 *
 * @promise {Object} Bundle object, containing recipes and client data.
 */
function fetchBundle() {
    let {bundleUrl} = document.documentElement.dataset;
    let headers = {Accept: 'application/json'};

    return getFetchRecipePayload()
    .then(data => xhr.post(bundleUrl, {data, headers}))
    .then(request => JSON.parse(request.responseText));
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


// Actually fetch and run the recipes.
fetchBundle().then(bundle => {
    // Update Normandy driver with user's country.
    Normandy._location.countryCode = bundle.country;

    for (let recipe of bundle.recipes) {
        runRecipe(recipe).catch(err => {
            console.error(err);
        });
    }
}).catch((err) => {
    console.error(err);
});
