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
            if (req.status !== 200) {
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
    }
};


/**
 * Download the implementation of the given action from the server.
 *
 * @param {Action} action  - Action taken from a Recipe.
 * @promise Resolves once the action has been loaded and registered.
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
                    resolve();
                }
            };
            document.head.appendChild(script);
        } else {
            resolve();
        }
    });
}

/**
 * Fetch recipes from the Recipe server.
 *
 * @promise {Array<Recipe>} List of recipes.
 */
function fetchRecipes() {
    let {recipe_url, locale} = document.documentElement.dataset;

    return xhr.post(recipe_url, {
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
    return Promise.all(recipe.actions.map(loadAction)).then(() => {
        let recipePromise = Promise.resolve();

        for (let action of recipe.actions) {
            let func = registeredActions[action.name];
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
        chain.then(() => {
            return runRecipe(recipe);
        });
    }

    return chain;
}).catch((err) => {
    console.error(err);
});
