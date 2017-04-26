import {
  RECIPE_RECEIVE,
  RECIPE_FILTERS_RECEIVE,
  RECIPE_HISTORY_RECEIVE,
  REVISION_RECEIVE,
} from '../action-types';

import {
  makeApiRequest,
} from '../requests/actions';


export function fetchRecipe(pk) {
  return async dispatch => {
    const requestId = `fetch-recipe-${pk}`;
    const response = makeApiRequest(requestId, `recipe/${pk}/`, { method: 'GET' });
    const recipe = await response;

    dispatch({
      type: RECIPE_RECEIVE,
      recipe,
    });
  };
}


export function fetchAllRecipes() {
  return async dispatch => {
    const requestId = 'fetch-all-recipes';
    const response = makeApiRequest(requestId, 'recipe/', { method: 'GET' });
    const recipes = await response;

    recipes.forEach(recipe => {
      dispatch({
        type: RECIPE_RECEIVE,
        recipe,
      });
    });
  };
}


export function fetchRecipeHistory(pk) {
  return async dispatch => {
    const requestId = `fetch-recipe-history-${pk}`;
    const response = dispatch(
      makeApiRequest(requestId, `recipe/${pk}/history/`, { method: 'GET' }));
    const revisions = await response;

    dispatch({
      type: RECIPE_HISTORY_RECEIVE,
      recipeId: pk,
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


export function fetchRecipeFilters() {
  return async dispatch => {
    const requestId = 'fetch-recipe-filters';
    const response = dispatch(makeApiRequest(requestId, 'filters/', { method: 'GET' }));
    const filters = await response;

    dispatch({
      type: RECIPE_FILTERS_RECEIVE,
      filters,
    });
  };
}
