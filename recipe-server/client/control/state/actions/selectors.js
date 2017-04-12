import { DEFAULT_REQUEST } from '../constants';


export function getRequest(state, id, defaultsTo = DEFAULT_REQUEST) {
  return state.getIn(['actions', 'requests', id], defaultsTo);
}


export function getAction(state, id, defaultsTo) {
  return state.getIn(['actions', 'objects', id], defaultsTo);
}
