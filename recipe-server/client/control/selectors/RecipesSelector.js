/**
 * Recipes selectors
 */

import moment from 'moment';

import {
  getFilterParamString,
} from 'control/selectors/FiltersSelector';

/**
 * Utility to find pre-cached recipes based on activated filters.
 *
 * This is used to cache the results of filtered recipes
 * returned from the server - given a set of filters,
 * the func will find the list (if any) of previously-returned items.
 * This allows us to display the cached recipes while the new call is made.
 *
 * @param  {Object}     recipes Recipes object from the redux store
 * @param  {Array<Object>}  filters Filters array from the redux store
 * @return {Array<Object>}  List of recipes that match the provided 'filters' config
 */
export function getRecipesList(recipes, filters) {
  const filterCacheKey = getFilterParamString(filters);

  let foundList = filterCacheKey ? recipes.cache[filterCacheKey] : recipes.entries;
  foundList = foundList || {};

  return Object.keys(foundList).map(recipeId => foundList[recipeId]);
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

export function getLastApprovedRevision(revisions) {
  return [].concat(Object.keys(revisions || {}))
    // Array of revision objects
    .map(id => revisions[id])
    // Which have approval requests
    .filter(rev => !!rev.approval_request)
    // Which are confirmed approved
    .filter(rev => rev.approval_request.approved === true)
    .reduce((prev, current) => {
      if (!prev.approval_request) {
        return current;
      }

      const prevTime = moment().diff(prev.approval_request.created);
      const currentTime = moment().diff(current.approval_request.created);

      return prevTime < currentTime ? prev : current;
    }, {});
}


export function getSelectedRevision({ recipes = {} }) {
  let recipe = null;
  let revision = null;
  const selectedRecipeId = recipes.selectedRecipe;
  let selectedRevisionId = recipes.selectedRevision;

  const recipeRevisions = recipes.revisions[selectedRecipeId] || {};

  if (selectedRecipeId) {
    recipe = recipes.entries[selectedRecipeId];

    if (!selectedRevisionId) {
      selectedRevisionId = recipe && recipe.latest_revision_id;
    }

    revision = (recipeRevisions[selectedRevisionId] || {}).recipe;
  }

  return {
    recipe,
    revision,
  };
}
