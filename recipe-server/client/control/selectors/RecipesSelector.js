/* eslint-disable import/prefer-default-export */

/**
 * Recipes selectors
 */
import moment from 'moment';

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
