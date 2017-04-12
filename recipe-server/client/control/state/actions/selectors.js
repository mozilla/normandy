import { DEFAULT_REQUEST } from '../constants';


export function getRequest(state, id) {
  const requests = state.get('actions').get('requests');
  return requests.get(id, DEFAULT_REQUEST);
}


export function getAction(state, id) {
  const recipes = state.get('actions').get('objects');
  return recipes.get(id);
}
