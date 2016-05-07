import apiFetch from '../utils/apiFetch.js';

export const REQUEST_IN_PROGRESS = 'REQUEST_IN_PROGRESS';
export const REQUEST_COMPLETE = 'REQUEST_COMPLETE';
export const RECIPES_RECEIVED = 'RECIPES_RECEIVED';
export const SET_SELECTED_RECIPE = 'SET_SELECTED_RECIPE';


const BASE_API_URL = '/api/v1/recipe/';

const API_REQUEST_SETTINGS = {
  credentials: 'include',
  headers: {
    'X-CSRFToken': document.getElementsByTagName('html')[0].dataset.csrf
  }
};

const apiRequestMap = {
  fetchAllRecipes(settings, getState) {
    if (shouldFetchRecipes(getState())) {
      return {
        url: BASE_API_URL,
        settings: {
          method: 'get'
        },
        actionOnSuccess: recipesReceived
      };
    } else {
      return null;
    }
  }
};


function requestInProgress() {
  return {
    type: REQUEST_IN_PROGRESS
  };
}

function requestComplete(status) {
  return {
    type: REQUEST_COMPLETE,
    status: status
  };
}

function recipesReceived(recipes) {
  return {
    type: RECIPES_RECEIVED,
    recipes
  };
}

function shouldFetchRecipes(state) {
  if (state.controlApp.recipeListNeedsFetch === true &&
      state.controlApp.isFetching === false) {
    return true;
  } else {
    return false;
  }
}

export function setSelectedRecipe(recipeId) {
  return {
    type: SET_SELECTED_RECIPE,
    recipeId
  };
}

export function makeApiRequest(requestType, settings) {
  return (dispatch, getState) => {
    let apiRequestConfig = apiRequestMap[requestType](settings, getState);
    if (apiRequestConfig) {
      dispatch(requestInProgress());
      return apiFetch(apiRequestConfig.url, {
        ...apiRequestConfig.settings,
        ...API_REQUEST_SETTINGS
      })
      .then(response => {
        dispatch(requestComplete('success'));
        dispatch(apiRequestConfig.actionOnSuccess(apiRequestConfig.successActionParams || response));
      })
      .catch(() => {
        dispatch(requestComplete('failure'));
      });
    }
  };
}


export default {
  setSelectedRecipe,
  makeApiRequest,
};
