import {
  RECIPE_RECEIVE,
  RECIPE_FILTERS_RECEIVE,
  RECIPE_HISTORY_RECEIVE,
  REVISION_RECEIVE,
} from '../action-types';

import {
  makeApiRequest,
} from '../requests/actions';


function receiveRecipe(recipe) {
  return dispatch => {
    dispatch({
      type: RECIPE_RECEIVE,
      recipe,
    });
  };
}


export function fetchRecipe(pk) {
  const requestId = `fetch-${pk}`;
  return makeApiRequest(requestId, `recipe/${pk}/`, { method: 'GET' })
    .then(recipe => receiveRecipe(recipe));
}


function receiveAllRecipes(recipes) {
  return dispatch => {
    recipes.forEach(recipe => {
      dispatch({
        type: RECIPE_RECEIVE,
        recipe,
      });
    });
  };
}


export function fetchAllRecipes() {
  const requestId = 'fetch-all';
  return makeApiRequest(requestId, 'recipe/', { method: 'GET' })
    .then(recipes => receiveAllRecipes(recipes));
}


function receiveRecipeHistory(recipeId, revisions) {
  return dispatch => {
    dispatch({
      type: RECIPE_HISTORY_RECEIVE,
      recipeId,
      revisions,
    });

    revisions.forEach(revision => {
      dispatch({
        type: REVISION_RECEIVE,
        revision,
      });
    });
  };
}


export function fetchRecipeHistory(pk) {
  const requestId = `fetch-history-${pk}`;
  return makeApiRequest(requestId, `recipe/${pk}/history/`, { method: 'GET' })
    .then(revisions => receiveRecipeHistory(pk, revisions));
}


function receiveRecipeFilters(filters) {
  return dispatch => {
    dispatch({
      type: RECIPE_FILTERS_RECEIVE,
      filters,
    });
  };
}


export function fetchRecipeFilters() {
  const requestId = 'fetch-filters';
  return makeApiRequest(requestId, 'filters/', { method: 'GET' })
    .then(filters => receiveRecipeFilters(filters));
}
