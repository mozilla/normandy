import { DEFAULT_REQUEST } from '../constants';


export function getRequest(state, id, defaultsTo = DEFAULT_REQUEST) {
  return state.getIn(['approvalRequests', 'requests', id], defaultsTo);
}


export function getApprovalRequest(state, id, defaultsTo) {
  return state.getIn(['approvalRequests', 'objects', id], defaultsTo);
}
