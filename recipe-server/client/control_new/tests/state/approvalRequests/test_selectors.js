import { fromJS } from 'immutable';

import { getApprovalRequest } from 'control_new/state/app/approvalRequests/selectors';
import {
  INITIAL_STATE,
} from 'control_new/tests/state';
import {
  ApprovalRequestFactory,
} from 'control_new/tests/state/approvalRequests';


describe('getApprovalRequest', () => {
  const approvalRequest = new ApprovalRequestFactory();

  const STATE = {
    ...INITIAL_STATE,
    app: {
      ...INITIAL_STATE.app,
      approvalRequests: {
        ...INITIAL_STATE.app.approvalRequests,
        items: INITIAL_STATE.app.approvalRequests.items.set(
          approvalRequest.id, fromJS(approvalRequest),
        ),
      },
    },
  };

  it('should return the approval request', () => {
    expect(getApprovalRequest(STATE, approvalRequest.id)).toEqual(fromJS(approvalRequest));
  });

  it('should return `null` for invalid ID', () => {
    expect(getApprovalRequest(STATE, 0)).toEqual(null);
  });

  it('should return default value for invalid ID with default provided', () => {
    expect(getApprovalRequest(STATE, 0, 'default')).toEqual('default');
  });
});
