import {
  ACTION_RECEIVE,
  RECIPE_DELETE,
  RECIPE_RECEIVE,
  RECIPE_FILTERS_RECEIVE,
  RECIPE_HISTORY_RECEIVE,
  REVISION_RECEIVE,
} from 'control_new/state/action-types';

import {
  makeApiRequest,
} from 'control_new/state/requests/actions';


function recipeReceived(recipe) {
  return dispatch => {
    dispatch({
      type: RECIPE_RECEIVE,
      recipe,
    });

    dispatch({
      type: ACTION_RECEIVE,
      action: recipe.action,
    });

    dispatch({
      type: REVISION_RECEIVE,
      revision: recipe.latest_revision,
    });

    if (recipe.approved_revision) {
      dispatch({
        type: REVISION_RECEIVE,
        revision: recipe.approved_revision,
      });
    }
  };
}


export function fetchRecipe(pk) {
  return async dispatch => {
    const requestId = `fetch-recipe-${pk}`;
    const recipe = await dispatch(makeApiRequest(requestId, `v2/recipe/${pk}/`));
    dispatch(recipeReceived(recipe));
  };
}


export function fetchAllRecipes() {
  return async dispatch => {
    const requestId = 'fetch-all-recipes';
    const recipes = await dispatch(makeApiRequest(requestId, 'v2/recipe/'));

    recipes.forEach(recipe => {
      dispatch(recipeReceived(recipe));
    });
  };
}


export function fetchFilteredRecipes(filters) {
  return async dispatch => {
    const filterIds = Object.keys(filters).map(key => `${key}-${filters[key]}`);
    const requestId = `fetch-filtered-recipes-${filterIds.join('-')}`;
    const recipes = await dispatch(makeApiRequest(requestId, 'v2/recipe/', {
      data: filters,
    }));

    recipes.forEach(recipe => {
      dispatch(recipeReceived(recipe));
    });
  };
}


export function createRecipe(recipeData) {
  return async dispatch => {
    const requestId = 'create-recipe';
    const recipe = await dispatch(makeApiRequest(requestId, 'v2/recipe/', {
      method: 'POST',
      data: recipeData,
    }));
    dispatch(recipeReceived(recipe));
  };
}


export function updateRecipe(pk, recipeData) {
  return async dispatch => {
    const requestId = `update-recipe-${pk}`;
    const recipe = await dispatch(makeApiRequest(requestId, `v2/recipe/${pk}/`, {
      method: 'PATCH',
      data: recipeData,
    }));
    dispatch(recipeReceived(recipe));
  };
}


export function deleteRecipe(pk) {
  return async dispatch => {
    const requestId = `delete-recipe-${pk}`;

    await dispatch(makeApiRequest(requestId, `v2/recipe/${pk}/`, {
      method: 'DELETE',
    }));

    dispatch({
      type: RECIPE_DELETE,
      recipeId: pk,
    });
  };
}


export function enableRecipe(pk) {
  return async dispatch => {
    const requestId = `enable-recipe-${pk}`;
    const recipe = await dispatch(makeApiRequest(requestId, `v2/recipe/${pk}/enable/`, {
      method: 'POST',
    }));
    dispatch(recipeReceived(recipe));
  };
}


export function disableRecipe(pk) {
  return async dispatch => {
    const requestId = `enable-recipe-${pk}`;
    const recipe = await dispatch(makeApiRequest(requestId, `v2/recipe/${pk}/disable/`, {
      method: 'POST',
    }));
    dispatch(recipeReceived(recipe));
  };
}


export function fetchRecipeHistory(pk) {
  return async dispatch => {
    const requestId = `fetch-recipe-history-${pk}`;
    const revisions = await dispatch(makeApiRequest(requestId, `v2/recipe/${pk}/history/`));

    revisions.forEach(revision => {
      dispatch({
        type: REVISION_RECEIVE,
        revision,
      });
    });

    dispatch({
      type: RECIPE_HISTORY_RECEIVE,
      recipeId: pk,
      revisions,
    });
  };
}


export function fetchRecipeFilters() {
  return async dispatch => {
    const requestId = 'fetch-recipe-filters';
    const filters = await dispatch(makeApiRequest(requestId, 'v2/filters/'));

    dispatch({
      type: RECIPE_FILTERS_RECEIVE,
      filters,
    });
  };
}
