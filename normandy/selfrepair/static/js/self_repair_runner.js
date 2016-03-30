// Trigger heartbeat callbacks when the UITour tells us that Heartbeat
// happened.
Mozilla.UITour.observe((eventName, data) => {
    if (eventName.startsWith('Heartbeat')) {
        let flowId = data.flowId;
        if (flowId in Normandy.heartbeatCallbacks) {
            Normandy.heartbeatCallbacks[flowId](data);
        }
    }
});


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
function get_fetch_recipe_payload() {
    let data = {
        locale: document.documentElement.dataset.locale,
        user_id: get_user_id(),
        release_channel: null,
        version: null,
    };

    return get_uitour_appinfo()
    .then(uitour_data => {
        data['release_channel'] = uitour.defaultUpdateChannel;
        data['version'] = uitour.version;
        return data;
    });
}

/**
 * @promise {Object} The appinfo from UITour
 */
function get_uitour_appinfo() {
    return new Promise((resolve, reject) => {
        Mozilla.UITour.getConfiguration('appinfo', appinfo => {
            resolve(appinfo);
        });
    });
}

/**
 * Get a user_id. If one doesn't exist yet, make one up and store it in local storage.
 * @return {String} A stored or generated UUID
 */
function get_user_id() {
    let user_id = localStorage.getItem('user_id');
    if (user_id === null) {
        user_id = uuid.v4();
        localStorage.setItem('user_id', user_id);
    }
    return user_id;
}

/**
 * Fetch recipes from the Recipe server.
 *
 * @promise {Array<Recipe>} List of recipes.
 */
function fetchRecipes() {
    let {recipeUrl} = document.documentElement.dataset;
    let headers = {Accept: 'application/json'};

    get_fetch_recipe_payload()
    .then(data => xhr.post(recipeUrl, {data, headers}))
    .then(request => JSON.parse(request.responseText).recipes);
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
fetchRecipes().then((recipes) => {
    let chain = Promise.resolve();

    for (let recipe of recipes) {
        chain.then(runRecipe.bind(null, recipe));
    }

    return chain;
}).catch((err) => {
    console.error(err);
});
