export const RECIPES_RECEIVED = 'RECIPES_RECEIVED';
export const SINGLE_RECIPE_RECEIVED = 'SINGLE_RECIPE_RECEIVED';
export const SINGLE_REVISION_RECEIVED = 'SINGLE_REVISION_RECEIVED';

export const RECIPES_NEED_FETCH = 'RECIPES_NEED_FETCH';
export const SET_SELECTED_RECIPE = 'SET_SELECTED_RECIPE';
export const SET_SELECTED_REVISION = 'SET_SELECTED_REVISION';
export const REVISIONS_RECEIVED = 'REVISIONS_RECEIVED';
export const REVISION_RECIPE_UPDATED = 'REVISION_RECIPE_UPDATED';

export const RECIPE_ADDED = 'RECIPE_ADDED';
export const RECIPE_UPDATED = 'RECIPE_UPDATED';
export const RECIPE_DELETED = 'RECIPE_DELETED';

export function recipesReceived(recipes, cacheKey) {
  return {
    type: RECIPES_RECEIVED,
    recipes,
    cacheKey,
  };
}

export function recipesNeedFetch() {
  return {
    type: RECIPES_NEED_FETCH,
  };
}

export function singleRecipeReceived(recipe) {
  return {
    type: SINGLE_RECIPE_RECEIVED,
    recipe,
  };
}

export function singleRevisionReceived(revision) {
  return {
    type: SINGLE_REVISION_RECEIVED,
    revision,
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

export function setSelectedRevision(revisionId) {
  return {
    type: SET_SELECTED_REVISION,
    revisionId,
  };
}

export function revisionsReceived({ recipeId, revisions }) {
  return {
    type: REVISIONS_RECEIVED,
    recipeId,
    revisions,
  };
}

export function revisionRecipeUpdated({ revisionId, recipe }) {
  return {
    type: REVISION_RECIPE_UPDATED,
    revisionId,
    recipe,
  };
}
