import { DEFAULT_REQUEST } from '../constants';


export function getRequest(state, id) {
  const requests = state.get('approvalRequests').get('requests');
  return requests.get(id, DEFAULT_REQUEST);
}


export function getRecipe(state, id) {
  const recipes = state.get('approvalRequests').get('objects');
  return recipes.get(id);
}
