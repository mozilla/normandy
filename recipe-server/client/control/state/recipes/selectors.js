import { List } from 'immutable';

import { DEFAULT_REQUEST } from '../constants';
import { getRevision } from '../revisions/selectors';


export function getRequest(state, id, defaultsTo = DEFAULT_REQUEST) {
  return state.getIn(['recipes', 'requests', id], defaultsTo);
}


export function getRecipe(state, id, defaultsTo) {
  return state.getIn(['recipes', 'objects', id], defaultsTo);
}


export function getRecipeHistory(state, id) {
  const history = state.getIn(['recipes', 'history', id], List([]));
  return history.map(revisionId => getRevision(state, revisionId));
}


export function getRecipeFilters(state, defaultsTo) {
  return state.getIn(['recipes', 'filters'], defaultsTo);
}
