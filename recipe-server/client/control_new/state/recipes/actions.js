import * as localForage from 'localforage';

import {
  ACTION_RECEIVE,
  RECIPE_DELETE,
  RECIPE_LISTING_COLUMNS_CHANGE,
  RECIPE_PAGE_RECEIVE,
  RECIPE_RECEIVE,
  RECIPE_FILTERS_RECEIVE,
  RECIPE_HISTORY_RECEIVE,
  REVISION_RECEIVE,
} from 'control_new/state/action-types';
import {
  makeApiRequest,
} from 'control_new/state/requests/actions';
import {
  revisionReceived,
} from 'control_new/state/revisions/actions';


export function recipeReceived(recipe) {
  return dispatch => {
    dispatch({
      type: RECIPE_RECEIVE,
      recipe,
    });

    dispatch({
      type: ACTION_RECEIVE,
      action: recipe.action,
    });

    dispatch(revisionReceived(recipe.latest_revision));

    if (recipe.approved_revision && recipe.approved_revision.id !== recipe.latest_revision.id) {
      dispatch(revisionReceived(recipe.approved_revision));
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


export function fetchRecipesPage(pageNumber = 1) {
  return async dispatch => {
    const requestId = `fetch-recipes-page-${pageNumber}`;
    const recipes = await dispatch(makeApiRequest(requestId, 'v2/recipe/', {
      data: { page: pageNumber },
    }));

    recipes.results.forEach(recipe => {
      dispatch(recipeReceived(recipe));
    });

    dispatch({
      type: RECIPE_PAGE_RECEIVE,
      pageNumber,
      recipes,
    });
  };
}


export function fetchFilteredRecipesPage(pageNumber = 1, filters = {}) {
  return async dispatch => {
    const filterIds = Object.keys(filters).map(key => `${key}-${filters[key]}`);
    const requestId = `fetch-filtered-recipes-page-${pageNumber}-${filterIds.join('-')}`;
    const recipes = await dispatch(makeApiRequest(requestId, 'v2/recipe/', {
      data: {
        ...filters,
        page: pageNumber,
      },
    }));

    recipes.results.forEach(recipe => {
      dispatch(recipeReceived(recipe));
    });

    dispatch({
      type: RECIPE_PAGE_RECEIVE,
      pageNumber,
      recipes,
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

    return recipe.id;
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
      dispatch(revisionReceived(revision));
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


export function loadRecipeListingColumns() {
  return async dispatch => {
    const columns = await localForage.getItem('recipe_listing_columns');

    if (columns) {
      dispatch({
        type: RECIPE_LISTING_COLUMNS_CHANGE,
        columns,
      });
    }
  };
}


export function saveRecipeListingColumns(columns) {
  return dispatch => {
    localForage.setItem('recipe_listing_columns', columns);

    dispatch({
      type: RECIPE_LISTING_COLUMNS_CHANGE,
      columns,
    });
  };
}
