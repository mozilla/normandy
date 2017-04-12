import { DEFAULT_REQUEST } from '../constants';


export function getRequest(state, id) {
  const requests = state.get('recipes').get('requests');
  return requests.get(id, DEFAULT_REQUEST);
}


export function getRecipe(state, id) {
  const recipes = state.get('recipes').get('objects');
  return recipes.get(id);
}
