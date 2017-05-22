import { List } from 'immutable';

import { getAction } from '../actions/selectors';
import { getRevision } from '../revisions/selectors';


export function getRecipe(state, id, defaultsTo = null) {
  const recipe = state.newState.recipes.items.get(id);

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


export function getRecipeHistory(state, id) {
  const history = state.newState.recipes.history.get(id, new List([]));
  return history.map(revisionId => getRevision(state, revisionId));
}


export function getRecipeFilters(state) {
  return state.newState.recipes.filters;
}
