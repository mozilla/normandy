/**
 * Recipes selectors
 */

/**
 * Given the `recipes` state, returns an array
 * of all the recipes stored in `recipes.entries`.
 *
 * @param  {Object} recipes `recipes` store state tree
 * @return {Array}         Array of all loaded recipes
 */
export function getRecipesList(recipes) {
  return [].concat(Object.keys(recipes.entries))
    .map(recipeId => recipes.entries[recipeId]);
}

/**
 * Given the `recipes` state, returns
 * the selected recipe definition (or null, if none).
 *
 * @param  {Object} recipes `recipes` store state tree
 * @return {Object}         Selected recipe object
 */
export function getSelectedRecipe(recipes) {
  return recipes.entries[recipes.selectedRecipe] || null;
}
