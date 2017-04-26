import { List } from 'immutable';

import { getRevision } from '../revisions/selectors';


export function getRecipe(state, id, defaultsTo) {
  return state.newState.recipes.items.get(id, defaultsTo);
}


export function getRecipeHistory(state, id) {
  const history = state.newState.recipes.history.get(id, new List([]));
  return history.map(revisionId => getRevision(state, revisionId));
}


export function getRecipeFilters(state) {
  return state.newState.recipes.filters;
}
