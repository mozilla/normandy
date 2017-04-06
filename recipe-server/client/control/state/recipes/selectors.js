import { DEFAULT_REQUEST } from '../constants';


export function getRequest(state, id) {
  return state.recipes.requests[id] || DEFAULT_REQUEST;
}
