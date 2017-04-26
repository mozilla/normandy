/* eslint import/prefer-default-export: "off" */

export function getApprovalRequest(state, id, defaultsTo) {
  return state.approvalRequests.items.get(id, defaultsTo);
}
