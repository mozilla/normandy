/* eslint-disable import/prefer-default-export */

/**
 * Recipe selectors
 *
 * Basically a set of helper functions to apply to a store when connecting with redux.
 * This simplifies in-view logic - no more .maps or .filters in mapStateToProps!
 */

import {
  getFilterParams,
} from 'control/selectors/FiltersSelector';

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
  const filterCacheKey = getFilterParams(filters);
  const foundList = (filterCacheKey ? recipes.cache[filterCacheKey] : recipes.list) || [];

  return foundList;
}
