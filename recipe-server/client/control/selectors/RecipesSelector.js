/**
 * Recipes selectors
 */

import {
  getFilterParamString,
} from 'control/selectors/FiltersSelector';

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

/**
 * Utility to find pre-cached recipes based on activated filters.
 *
 * This is used to cache the results of filtered recipes
 * returned from the server - given a set of filters,
 * the func will find the list (if any) of previously-returned items.
 * This allows us to display the cached recipes while the new call is made.
 *
 * @param  {Object} 		recipes Recipes object from the redux store
 * @param  {Array<Object>}  filters Filters array from the redux store
 * @return {Array<Object>}  List of recipes that match the provided 'filters' config
 */
export function getCachedRecipes(recipes, filters) {
  const filterCacheKey = getFilterParamString(filters);
  const foundList = filterCacheKey ? recipes.cache[filterCacheKey] : recipes.entries;

  return [].concat(Object.keys(foundList || {})).map(recipeId => foundList[recipeId]);
}
