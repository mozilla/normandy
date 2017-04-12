import { DEFAULT_REQUEST } from '../constants';


export function getRequest(state, id, defaultsTo = DEFAULT_REQUEST) {
  return state.getIn(['revisions', 'requests', id], defaultsTo);
}


export function getRevision(state, id, defaultsTo) {
  return state.getIn(['revisions', 'objects', id], defaultsTo);
}
