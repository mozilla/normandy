import { getRequest } from './selectors';

import {
  RECIPE_FETCH,
  RECIPE_FETCH_FAILURE,
  RECIPE_FETCH_SUCCESS,
  RECIPE_RECEIVE,
  RECIPES_FETCH,
  RECIPES_FETCH_FAILURE,
  RECIPES_FETCH_SUCCESS,
} from '../action-types';

import apiFetch from '../../utils/apiFetch';


function fetchRecipeSuccess(dispatch, requestId, recipe) {
  dispatch({
    type: RECIPE_FETCH_SUCCESS,
    requestId,
  });

  dispatch({
    type: RECIPE_RECEIVE,
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

function fetchRecipesSuccess(dispatch, requestId, recipes) {
  dispatch({
    type: RECIPES_FETCH_SUCCESS,
    requestId,
  });

  recipes.forEach(recipe => {
    dispatch({
      type: RECIPE_RECEIVE,
      recipe,
    });
  });
}


function fetchRecipesFailure(dispatch, requestId, error) {
  dispatch({
    type: RECIPES_FETCH_FAILURE,
    error,
    requestId,
  });
}


export function fetchRecipes() {
  return (dispatch, getState) => {
    const requestId = 'fetch';
    const request = getRequest(getState(), requestId);

    if (request.loading) { return true; }

    dispatch({
      type: RECIPES_FETCH,
      requestId,
    });

    return apiFetch('recipe/', { method: 'GET' })
      .then(recipes => fetchRecipesSuccess(dispatch, requestId, recipes))
      .catch(error => fetchRecipesFailure(dispatch, requestId, error));
  };
}
