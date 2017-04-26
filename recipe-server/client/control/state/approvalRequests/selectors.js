/* eslint import/prefer-default-export: "off" */

export function getApprovalRequest(state, id, defaultsTo) {
  return state.getIn(['approvalRequests', 'items', id], defaultsTo);
}
