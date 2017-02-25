/* eslint-disable import/prefer-default-export */

/**
 * Recipes selectors
 */

/**
 * Given a recipe, returns its approval request, if any exists.
 * @param  {Object} recipe Selected recipe to search for approval request.
 * @return {[type]}        [description]
 */
export function getRecipeApprovalRequest(recipe) {
  return recipe && recipe.approval_request;
}
