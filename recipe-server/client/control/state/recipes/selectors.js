import { List } from 'immutable';

import { getRevision } from '../revisions/selectors';


export function getRecipe(state, id, defaultsTo) {
  return state.getIn(['recipes', 'items', id], defaultsTo);
}


export function getRecipeHistory(state, id) {
  const history = state.getIn(['recipes', 'history', id], new List([]));
  return history.map(revisionId => getRevision(state, revisionId));
}


export function getRecipeFilters(state, defaultsTo) {
  return state.getIn(['recipes', 'filters'], defaultsTo);
}
