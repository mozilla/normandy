import { DEFAULT_REQUEST } from '../constants';


export function getRequest(state, id) {
  const requests = state.get('revisions').get('requests');
  return requests.get(id, DEFAULT_REQUEST);
}


export function getRevision(state, id) {
  const revisions = state.get('revisions').get('objects');
  return revisions.get(id);
}
