export const RECIPES_RECEIVED = 'RECIPES_RECEIVED';
export const SINGLE_RECIPE_RECEIVED = 'SINGLE_RECIPE_RECEIVED';
export const RECIPE_ADDED = 'RECIPE_ADDED';
export const RECIPE_UPDATED = 'RECIPE_UPDATED';
export const RECIPE_DELETED = 'RECIPE_DELETED';
export const SET_SELECTED_RECIPE = 'SET_SELECTED_RECIPE';
export const RECIPES_NEED_FETCH = 'RECIPES_NEED_FETCH';

/**
 * Dispatched events
 */
export function recipesNeedFetch() {
  return {
    type: RECIPES_NEED_FETCH,
  };
}

export function recipesReceived(recipes) {
  return {
    type: RECIPES_RECEIVED,
    recipes,
  };
}

export function singleRecipeReceived(recipe) {
  return {
    type: SINGLE_RECIPE_RECEIVED,
    recipe,
  };
}

export function recipeAdded(recipe) {
  return {
    type: RECIPE_ADDED,
    recipe,
  };
}

export function recipeUpdated(recipe) {
  return {
    type: RECIPE_UPDATED,
    recipe,
  };
}

export function recipeDeleted(recipeId) {
  return {
    type: RECIPE_DELETED,
    recipeId,
  };
}

export function setSelectedRecipe(recipeId) {
  return {
    type: SET_SELECTED_RECIPE,
    recipeId,
  };
}
