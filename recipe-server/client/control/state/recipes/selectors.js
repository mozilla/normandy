import { DEFAULT_REQUEST } from '../constants';
import { getRevision } from '../revisions/selectors';


export function getRequest(state, id, defaultsTo = DEFAULT_REQUEST) {
  return state.getIn(['recipes', 'requests', id], defaultsTo);
}


export function getRecipe(state, id, defaultsTo) {
  return state.getIn(['recipes', 'objects', id], defaultsTo);
}


export function getRecipeHistory(state, id) {
  const history = state.getIn(['recipes', 'history', id]);
  return history.map(revisionId => getRevision(state, revisionId));
}
