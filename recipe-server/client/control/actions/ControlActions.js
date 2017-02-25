export const REQUEST_IN_PROGRESS = 'REQUEST_IN_PROGRESS';
export const REQUEST_COMPLETE = 'REQUEST_COMPLETE';

export const RECIPES_RECEIVED = 'RECIPES_RECEIVED';
export const SINGLE_RECIPE_RECEIVED = 'SINGLE_RECIPE_RECEIVED';

export const SET_SELECTED_RECIPE = 'SET_SELECTED_RECIPE';
export const SHOW_NOTIFICATION = 'SHOW_NOTIFICATION';
export const DISMISS_NOTIFICATION = 'DISMISS_NOTIFICATION';

export const RECIPE_ADDED = 'RECIPE_ADDED';
export const RECIPE_UPDATED = 'RECIPE_UPDATED';
export const RECIPE_DELETED = 'RECIPE_DELETED';


const BASE_API_URL = '/api/v1/';

const API_REQUEST_SETTINGS = {
  credentials: 'include',
  headers: {
    'X-CSRFToken': document.getElementsByTagName('html')[0].dataset.csrf,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};

const apiRequestMap = {
  fetchAllRecipes() {
    return {
      url: `${BASE_API_URL}recipe/`,
      settings: {
        method: 'GET',
      },
      errorNotification: 'Error fetching recipes.',
    };
  },

  fetchSingleRecipe(recipeInfo) {
    return {
      url: `${BASE_API_URL}recipe/${recipeInfo.recipeId}/`,
      settings: {
        method: 'GET',
      },
      errorNotification: 'Error fetching recipe.',
    };
  },

  fetchSingleRevision(recipeInfo) {
    return {
      url: `${BASE_API_URL}recipe_revision/${recipeInfo.revisionId}/`,
      settings: {
        method: 'GET',
      },
      errorNotification: 'Error fetching recipe revision.',
    };
  },

  getApprovalRequests() {
    return {
      url: `${BASE_API_URL}approval_request/`,
      settings: {
        method: 'GET',
      },
      errorNotification: 'Error fetching approval requests.',
    };
  },

  getApprovalRequestInfo({ requestId }) {
    return {
      url: `${BASE_API_URL}approval_request/${requestId}/`,
      settings: {
        method: 'GET',
      },
      errorNotification: 'Error fetching approval request info.',
    };
  },

  openApprovalRequest({ revisionId }) {
    return {
      url: `${BASE_API_URL}recipe_revision/${revisionId}/request_approval/`,
      settings: {
        method: 'POST',
        body: JSON.stringify({ revisionId }),
      },
      errorNotification: 'Error creating new approval request.',
    };
  },

  acceptApprovalRequest({ requestId, comment }) {
    return {
      url: `${BASE_API_URL}approval_request/${requestId}/approve/`,
      settings: {
        method: 'POST',
        body: JSON.stringify({ comment }),
      },
      errorNotification: 'Error accepting recipe approval.',
    };
  },

  rejectApprovalRequest({ requestId, comment }) {
    return {
      url: `${BASE_API_URL}approval_request/${requestId}/reject/`,
      settings: {
        method: 'POST',
        body: JSON.stringify({ comment }),
      },
      errorNotification: 'Error rejecting recipe approval.',
    };
  },

  closeApprovalRequest({ requestId }) {
    return {
      url: `${BASE_API_URL}approval_request/${requestId}/close/`,
      settings: {
        method: 'POST',
      },
      errorNotification: 'Error closing recipe approval request.',
    };
  },

  fetchRecipeHistory({ recipeId }) {
    return {
      url: `${BASE_API_URL}recipe/${recipeId}/history/`,
      settings: {
        method: 'GET',
      },
      errorNotification: 'Error fetching recipe history.',
    };
  },

  addRecipe({ recipe }) {
    return {
      url: `${BASE_API_URL}recipe/`,
      settings: {
        body: JSON.stringify(recipe),
        method: 'POST',
      },
    };
  },

  updateRecipe(recipeInfo) {
    return {
      url: `${BASE_API_URL}recipe/${recipeInfo.recipeId}/`,
      settings: {
        body: JSON.stringify(recipeInfo.recipe),
        method: 'PATCH',
      },
    };
  },

  deleteRecipe(recipeInfo) {
    return {
      url: `${BASE_API_URL}recipe/${recipeInfo.recipeId}/`,
      settings: {
        method: 'DELETE',
      },
      successNotification: 'Recipe deleted.',
      errorNotification: 'Error deleting recipe.',
    };
  },
};


function requestInProgress() {
  return {
    type: REQUEST_IN_PROGRESS,
  };
}

function requestComplete(result) {
  return dispatch => {
    if (result.notification) {
      dispatch(showNotification({ messageType: result.status, message: result.notification }));
    }

    dispatch({ type: REQUEST_COMPLETE, status: result.status });
  };
}

function recipesReceived(recipes) {
  return {
    type: RECIPES_RECEIVED,
    recipes,
  };
}

function singleRecipeReceived(recipe) {
  return {
    type: SINGLE_RECIPE_RECEIVED,
    recipe,
  };
}

function recipeAdded(recipe) {
  return {
    type: RECIPE_ADDED,
    recipe,
  };
}

function recipeUpdated(recipe) {
  return {
    type: RECIPE_UPDATED,
    recipe,
  };
}

function recipeDeleted(recipeId) {
  return {
    type: RECIPE_DELETED,
    recipeId,
  };
}

function setSelectedRecipe(recipeId) {
  return {
    type: SET_SELECTED_RECIPE,
    recipeId,
  };
}

function showNotification(notification) {
  return dispatch => {
    // Use time-based id and dismiss automatically after 10 seconds.
    notification.id = notification.id || new Date().getTime();
    setTimeout(() => {
      dispatch(dismissNotification(notification.id));
    }, 10000);

    dispatch({
      type: SHOW_NOTIFICATION,
      notification,
    });
  };
}

function dismissNotification(notificationId) {
  return {
    type: DISMISS_NOTIFICATION,
    notificationId,
  };
}

function makeApiRequest(requestType, requestData) {
  return dispatch => {
    const apiRequestConfig = apiRequestMap[requestType](requestData);

    dispatch(requestInProgress());

    return fetch(apiRequestConfig.url, {
      ...API_REQUEST_SETTINGS,
      ...apiRequestConfig.settings,
    })
    .then(response => {
      if (response.status >= 400) {
        return response.json().then(({ error }) => {
          dispatch(requestComplete({
            status: 'error',
            notification: `${apiRequestConfig.errorNotification} ${error}`,
          }));
          throw new Error(error);
        });
      }
      dispatch(requestComplete({
        status: 'success',
        notification: apiRequestConfig.successNotification,
      }));
      return (response.status === 204) ? response.text : response.json();
    });
  };
}


export {
  makeApiRequest,
  recipesReceived,
  singleRecipeReceived,
  setSelectedRecipe,
  showNotification,
  dismissNotification,
  recipeAdded,
  recipeUpdated,
  recipeDeleted,
};
