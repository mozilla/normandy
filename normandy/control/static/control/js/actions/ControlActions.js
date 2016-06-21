export const REQUEST_IN_PROGRESS = 'REQUEST_IN_PROGRESS';
export const REQUEST_COMPLETE = 'REQUEST_COMPLETE';

export const RECIPES_RECEIVED = 'RECIPES_RECEIVED';
export const SINGLE_RECIPE_RECEIVED = 'SINGLE_RECIPE_RECEIVED';

export const SET_SELECTED_RECIPE = 'SET_SELECTED_RECIPE';
export const SET_NOTIFICATION = 'SET_NOTIFICATION';

export const RECIPE_ADDED = 'RECIPE_ADDED';
export const RECIPE_UPDATED = 'RECIPE_UPDATED';
export const RECIPE_DELETED = 'RECIPE_DELETED';


const BASE_API_URL = '/api/v1/recipe/';

const API_REQUEST_SETTINGS = {
  credentials: 'include',
  headers: {
    'X-CSRFToken': document.getElementsByTagName('html')[0].dataset.csrf,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};

const apiRequestMap = {
  fetchAllRecipes() {
    return {
      url: BASE_API_URL,
      settings: {
        method: 'GET'
      },
      errorNotification: 'Error fetching recipes.'
    };
  },

  fetchSingleRecipe(recipeInfo) {
    let fetchUrl = (recipeInfo.recipeId ? `${BASE_API_URL}${recipeInfo.recipeId}/` : `/api/v1/recipe_version/${recipeInfo.revisionId}/`)
    return {
      url: fetchUrl,
      settings: {
        method: 'GET'
      },
      errorNotification: 'Error fetching recipe.'
    };
  },

  fetchRecipeHistory(recipeInfo) {
    return {
      url: `${BASE_API_URL}${recipeInfo.recipeId}/history/`,
      settings: {
        method: 'GET'
      },
      errorNotification: 'Error fetching recipe history.'
    };
  },

  addRecipe(recipeInfo) {
    return {
      url: BASE_API_URL,
      settings: {
        body: JSON.stringify(recipeInfo.recipe),
        method: 'POST'
      },
      successNotification: 'Recipe added.',
      errorNotification: 'Error adding recipe.'
    };
  },

  updateRecipe(recipeInfo) {
    return {
      url: `${BASE_API_URL}${recipeInfo.recipeId}/`,
      settings: {
        body: JSON.stringify(recipeInfo.recipe),
        method: 'PATCH'
      },
      successNotification: 'Recipe updated.',
      errorNotification: 'Error updating recipe.'
    };
  },

  deleteRecipe(recipeInfo) {
    return {
      url: `${BASE_API_URL}${recipeInfo.recipeId}/`,
      settings: {
        method: 'DELETE'
      }
    };
  }
};


function requestInProgress() {
  return {
    type: REQUEST_IN_PROGRESS
  };
}

function requestComplete(result) {
  return (dispatch) => {
    if (result.notification) {
      dispatch(setNotification({ messageType: result.status, message: result.notification }));
    }

    dispatch({ type: REQUEST_COMPLETE, status: result.status });
  }
}

function recipesReceived(recipes) {
  return {
    type: RECIPES_RECEIVED,
    recipes
  };
}

function singleRecipeReceived(recipe) {
  return {
    type: SINGLE_RECIPE_RECEIVED,
    recipe
  };
}

function recipeAdded(recipe) {
  return {
    type: RECIPE_ADDED,
    recipe
  };
}

function recipeUpdated(recipe) {
  return {
    type: RECIPE_UPDATED,
    recipe
  };
}

function recipeDeleted(recipeId) {
  return {
    type: RECIPE_DELETED,
    recipeId
  };
}

function setSelectedRecipe(recipeId) {
  return {
    type: SET_SELECTED_RECIPE,
    recipeId
  };
}

function setNotification(notification) {
  return {
    type: SET_NOTIFICATION,
    notification
  };
}

function makeApiRequest(requestType, requestData) {
  return (dispatch) => {
    let apiRequestConfig = apiRequestMap[requestType](requestData);

    dispatch(requestInProgress());

    return fetch(apiRequestConfig.url, {
      ...API_REQUEST_SETTINGS,
      ...apiRequestConfig.settings
    })
    .then(response => {
      if (response.status >= 400) {
        dispatch(requestComplete({ status: 'error', notification: apiRequestConfig.errorNotification }));
        return response.json().then(err => { throw err; });
      } else {
        dispatch(requestComplete({ status: 'success', notification: apiRequestConfig.successNotification }));
        return (response.status == 204) ? response.text : response.json();
      }
    });
  };
}


export {
  makeApiRequest,
  recipesReceived,
  singleRecipeReceived,
  setSelectedRecipe,
  setNotification,
  recipeAdded,
  recipeUpdated,
  recipeDeleted,
};
