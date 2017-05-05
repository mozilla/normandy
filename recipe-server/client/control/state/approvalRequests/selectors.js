/* eslint import/prefer-default-export: "off" */

export function getApprovalRequest(state, id, defaultsTo) {
  return state.newState.approvalRequests.items.get(id, defaultsTo);
}
