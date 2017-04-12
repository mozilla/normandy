import { DEFAULT_REQUEST } from '../constants';


export function getRequest(state, id, defaultsTo = DEFAULT_REQUEST) {
  return state.getIn(['recipes', 'requests', id], defaultsTo);
}


export function getRecipe(state, id, defaultsTo) {
  return state.getIn(['recipes', 'objects', id], defaultsTo);
}
