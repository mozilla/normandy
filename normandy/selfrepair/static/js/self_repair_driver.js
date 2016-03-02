/**
 * Convenience wrapper around XMLHttpRequest.
 *
 * @param {String} method - HTTP method to use.
 * @param {String} url - URL to send the request to.
 * @param {Object} options - Optional arguments.
 * @param {Object} options.data - Request data as an Object; keys are
 *     used as parameter names, values as parameter values.
 * @param {Object} options.headers - Headers and values to set on the
 *     request.
 * @promise {XMLHttpRequest} The request after it has succeeded.
 * @rejects {XMLHttpRequest} The request after it has failed.
 */
function xhr(method, url, options={}) {
    return new Promise((resolve, reject) => {
        let req = new XMLHttpRequest();
        req.addEventListener('load', e => {
            if (req.status >= 400) {
                reject(req);
            } else {
                resolve(req);
            }
        });
        req.open(method, url);

        let data = undefined;
        if (options.data) {
            req.setRequestHeader('Content-Type', 'application/json');
            data = JSON.stringify(data);
        }

        if (options.headers) {
            for (let key in options.headers) {
                req.setRequestHeader(key, options.headers[key]);
            }
        }

        req.send(data);
    });
}
xhr.get = xhr.bind(null, 'GET');
xhr.post = xhr.bind(null, 'POST');


let registeredActions = {};
window.Normandy = {
    registerAction(name, func) {
        registeredActions[name] = func;
    },

    heartbeatCallbacks: [],
    showHeartbeat(options) {
        return new Promise((resolve, reject) => {
            // TODO: Validate arguments and reject if some are missing.
            this.heartbeatCallbacks[options.flowId] = () => {
                resolve();
            };

            Mozilla.UITour.showHeartbeat(
                options.message,
                options.thanksMessage,
                options.flowId,
                options.postAnswerUrl,
                options.learnMoreMessage,
                options.learnMoreUrl
            );
        });

    },
};


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


/**
 * Download the implementation of the given action from the server.
 *
 * @param {Action} action  - Action taken from a Recipe.
 * @promise {Function} The implementation function for the given action.
 * @rejects {Error} Rejects if the action could not be loaded or did not
 *     register itself.
 */
function loadAction(action) {
    return new Promise((resolve, reject) => {
        if (!registeredActions[action.name]) {
            let script = document.createElement('script');
            script.src = action.implementation.url;
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
 * @promise Resolves once all actions are complete.
 */
function runRecipe(recipe) {
    return Promise.all(recipe.actions.map(loadAction)).then((funcs) => {
        let recipePromise = Promise.resolve();

        for (let k = 0; k < recipe.actions.length; k++) {
            let action = recipe.actions[k];
            let func = funcs[k];
            recipePromise = recipePromise.then(() => {
                return func(null, action.arguments);
            });
        }

        return recipePromise;
    });
}


// Actually fetch and run the recipes.
fetchRecipes().then((recipes) => {
    let chain = Promise.resolve();

    for (let recipe of recipes) {
        let cb = function(recipeToRun) {
            return runRecipe(recipeToRun);
        };
        chain.then(cb.bind(null, recipe));
    }

    return chain;
}).catch((err) => {
    console.error(err);
});
