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
        let actionName = recipe.implementation.name;
        if (!registeredActions[actionName]) {
            let script = document.createElement('script');
            script.src = recipe.implementation.url;
            script.onload = () => {
                if (!registeredActions[actionName]) {
                    reject(new Error(`Could not find action with name ${actionName}.`));
                } else {
                    resolve(registeredActions[actionName]);
                }
            };
            document.head.appendChild(script);
        } else {
            resolve(registeredActions[actionName]);
        }
    });
}

/**
 * Fetch recipes from the Recipe server.
 *
 * @promise {Array<Recipe>} List of recipes.
 */
function fetchRecipes() {
    let {recipeUrl, locale} = document.documentElement.dataset;

    return xhr.post(recipeUrl, {
        data: {locale: locale},
        headers: {Accept: 'application/json'}
    }).then(request => {
        return JSON.parse(request.responseText).recipes;
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
