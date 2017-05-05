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
    const recipe = await dispatch(makeApiRequest(requestId, `recipe/${pk}/`));

    dispatch({
      type: RECIPE_RECEIVE,
      recipe,
    });
  };
}


export function fetchAllRecipes() {
  return async dispatch => {
    const requestId = 'fetch-all-recipes';
    const recipes = await dispatch(makeApiRequest(requestId, 'recipe/'));

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
    const revisions = await dispatch(makeApiRequest(requestId, `recipe/${pk}/history/`));

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
    const filters = await dispatch(makeApiRequest(requestId, 'filters/'));

    dispatch({
      type: RECIPE_FILTERS_RECEIVE,
      filters,
    });
  };
}
