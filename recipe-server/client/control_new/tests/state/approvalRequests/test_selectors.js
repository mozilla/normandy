import { getApprovalRequest } from 'control_new/state/app/approvalRequests/selectors';

import {
  ApprovalRequestFactory,
} from '.';

import {
  INITIAL_STATE,
} from '..';


describe('getApprovalRequest', () => {
  const approvalRequest = new ApprovalRequestFactory();

  const STATE = {
    ...INITIAL_STATE,
    app: {
      ...INITIAL_STATE.app,
      approvalRequests: {
        ...INITIAL_STATE.app.approvalRequests,
        items: INITIAL_STATE.app.approvalRequests.items.set(
          approvalRequest.id, approvalRequest.toImmutable(),
        ),
      },
    },
  };

  it('should return the approval request', () => {
    expect(getApprovalRequest(STATE, approvalRequest.id)).toEqual(approvalRequest.toImmutable());
  });

  it('should return `null` for invalid ID', () => {
    expect(getApprovalRequest(STATE, 0)).toEqual(null);
  });

  it('should return default value for invalid ID with default provided', () => {
    expect(getApprovalRequest(STATE, 0, 'default')).toEqual('default');
  });
});
