import { List } from 'immutable';

import { getAction } from 'control_new/state/actions/selectors';
import { DEFAULT_RECIPE_LISTING_COLUMNS } from 'control_new/state/constants';
import { getRevision } from 'control_new/state/revisions/selectors';
import { getRouterParam } from 'control_new/state/router/selectors';


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

export function getCurrentRecipePk(state) {
  return Number.parseInt(getRouterParam(state, 'pk'), 10);
}

export function getCurrentRecipe(state, defaultsTo = null) {
  const pk = getCurrentRecipePk(state);
  return getRecipe(state, pk, defaultsTo);
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
