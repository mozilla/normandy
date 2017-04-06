import { getRequest } from './selectors';

import {
  RECIPE_FETCH,
  RECIPE_FETCH_FAILURE,
  RECIPE_FETCH_SUCCESS,
  RECIPE_RECIEVE,
} from '../action-types';

import apiFetch from '../../utils/apiFetch';


function fetchRecipeSuccess(dispatch, requestId, recipe) {
  dispatch({
    type: RECIPE_FETCH_SUCCESS,
    requestId,
  });

  dispatch({
    type: RECIPE_RECIEVE,
    recipe,
  });
}


function fetchRecipeFailure(dispatch, requestId, error) {
  dispatch({
    type: RECIPE_FETCH_FAILURE,
    error,
    requestId,
  });
}


export function fetchRecipe(pk) {
  return (dispatch, getState) => {
    const requestId = `fetch-${pk}`;
    const request = getRequest(getState(), requestId);

    if (request.loading) { return true; }

    dispatch({
      type: RECIPE_FETCH,
      requestId,
    });

    return apiFetch(`recipe/${pk}/`, { method: 'GET' })
      .then(recipe => fetchRecipeSuccess(dispatch, requestId, recipe))
      .catch(error => fetchRecipeFailure(dispatch, requestId, error));
  };
}
