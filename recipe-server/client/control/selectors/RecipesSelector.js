/**
 * Recipes selectors
 */

import moment from 'moment';

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
    recipe = recipes.list
      .find(rec => rec.id === selectedRecipeId);

    let latestId = -1;
    let latestTime;
    // If there is a selected revision, attempt to pull that info.
    if (!selectedRevisionId) {
      // If there is _not_ a selected revision, default to the latest

      for (const revisionId in recipeRevisions) {
        if (recipeRevisions.hasOwnProperty(revisionId)) {
          const sinceRevision = moment().diff(recipeRevisions[revisionId].date_created);
          if (!selectedRevisionId || sinceRevision < latestTime) {
            latestId = revisionId;
            latestTime = sinceRevision;
          }
        }
      }
      selectedRevisionId = latestId;
    }

    revision = (recipeRevisions[selectedRevisionId] || {}).recipe;

    if (!revision) {
      recipe = null;
    }
  }

  return {
    recipe,
    revision,
  };
}
