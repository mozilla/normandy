/* eslint import/prefer-default-export: "off" */
import { getUser } from 'control/state/app/users/selectors';


export function getApprovalRequest(state, id, defaultsTo = null) {
  const approvalRequest = state.app.approvalRequests.items.get(id);

  if (approvalRequest) {
    const creator = getUser(state, approvalRequest.get('creator_id'));
    const approver = getUser(state, approvalRequest.get('approver_id'));

    return approvalRequest
      .set('creator', creator)
      .remove('creator_id')
      .set('approver', approver)
      .remove('approver_id');
  }

  return defaultsTo;
}
