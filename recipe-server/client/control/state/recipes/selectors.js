import { DEFAULT_REQUEST } from '../constants';


export function getRequest(state, id) {
  const requests = state.get('recipes').get('requests');
  return requests.get(id, DEFAULT_REQUEST);
}
