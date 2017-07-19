import { List, Map } from 'immutable';

import { getAction } from 'control_new/state/actions/selectors';
import { DEFAULT_RECIPE_LISTING_COLUMNS } from 'control_new/state/constants';
import { getRevision, getRecipeForRevision } from 'control_new/state/revisions/selectors';
import { getUrlParam, getUrlParamAsInt } from 'control_new/state/router/selectors';

export function getRecipe(state, id, defaultsTo = null) {
  const recipe = state.app.recipes.items.get(id);

  if (recipe) {
    const action = getAction(state, recipe.get('action_id'));
    const latestRevision = getRevision(state, recipe.get('latest_revision_id'));
    const approvedRevision = getRevision(state, recipe.get('approved_revision_id'));

    return recipe
      .set('action', action)
      .set('latest_revision', latestRevision)
      .set('approved_revision', approvedRevision)
      .remove('action_id')
      .remove('latest_revision_id')
      .remove('approved_revision_id');
  }

  return defaultsTo;
}

export function getRecipeListingCount(state) {
  return state.app.recipes.listing.get('count');
}

export function getRecipeListing(state) {
  const recipes = state.app.recipes.listing.get('results', new List([]));
  return recipes.map(id => getRecipe(state, id));
}

export function getRecipeListingFlattenedAction(state) {
  const recipes = getRecipeListing(state);
  return recipes.map(item => item.set('action', item.getIn(['action', 'name'])));
}

export function getRecipeListingPageNumber(state) {
  return state.app.recipes.listing.get('pageNumber');
}

export function getRecipeListingColumns(state, defaultsTo = DEFAULT_RECIPE_LISTING_COLUMNS) {
  return state.app.recipes.listing.get('columns', defaultsTo);
}

export function getRecipeHistory(state, id) {
  const history = state.app.recipes.history.get(id, new List([]));
  return history.map(revisionId => getRevision(state, revisionId));
}

export function getRecipeFilters(state) {
  return state.app.recipes.filters;
}

export function isRecipeEnabled(state, id, defaultsTo = false) {
  const recipe = getRecipe(state, id, new Map());
  return recipe.get('enabled', defaultsTo);
}

export function getLatestRevisionForRecipe(state, id, defaultsTo = null) {
  const recipe = getRecipe(state, id, new Map());
  return recipe.get('latest_revision', defaultsTo);
}

export function getLatestRevisionIdForRecipe(state, id, defaultsTo = null) {
  const revision = getLatestRevisionForRecipe(state, id, new Map());
  if (revision) {
    return revision.get('id', defaultsTo);
  }
  return defaultsTo;
}

export function getApprovedRevisionForRecipe(state, id, defaultsTo = null) {
  const recipe = getRecipe(state, id, new Map());
  return recipe.get('approved_revision', defaultsTo);
}

export function getApprovedRevisionIdForRecipe(state, id, defaultsTo = null) {
  const revision = getApprovedRevisionForRecipe(state, id, new Map());
  if (revision) {
    return revision.get('id', defaultsTo);
  }
  return defaultsTo;
}

export function getRecipeApprovalHistory(state, id) {
  const history = getRecipeHistory(state, id);
  return history.filter(revision => revision.get('approval_request'));
}

export function getRecipeFromURL(state) {
  // Get recipe.
  const recipeId = getUrlParamAsInt(state, 'recipeId');
  const storedRecipe = getRecipe(state, recipeId, new Map());

  // Get revision id, if provided.
  const revisionParam = getUrlParam(state, 'revisionId', null);
  const hasRevisionParam = revisionParam !== null;
  const latestRevisionId = storedRecipe.getIn(['latest_revision', 'id']);

  // If a revision id was given, use that, else use the `latest_revision.id` from the recipe.
  const selectedRevisionId = hasRevisionParam ? revisionParam : latestRevisionId;

  // Get the actual recipe values for returning.
  const recipe = getRecipeForRevision(state, selectedRevisionId, new Map());

  // Utility boolean.
  const isLatestRevision = !hasRevisionParam || selectedRevisionId === latestRevisionId;

  return {
    isLatestRevision,
    revisionId: selectedRevisionId,
    recipeId,
    recipe,
  };
}
