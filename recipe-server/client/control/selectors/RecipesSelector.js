/**
 * Recipes selectors
 */

/**
 * Given the `recipes` state, returns an array
 * of all the recipes stored in `recipes.list`.
 *
 * @param  {Object} recipes `recipes` store state tree
 * @return {Array}         Array of all loaded recipes
 */
export function getRecipesList(recipes) {
  const listArray = [];
  Object.keys(recipes.list).forEach(recipeId => {
    listArray.push(recipes.list[recipeId]);
  });

  return listArray;
}

/**
 * Given the `recipes` state, returns
 * the selected recipe definition (or null, if none).
 *
 * @param  {Object} recipes `recipes` store state tree
 * @return {Object}         Selected recipe object
 */
export function getSelectedRecipe(recipes) {
  return recipes.list[recipes.selectedRecipe] || null;
}
