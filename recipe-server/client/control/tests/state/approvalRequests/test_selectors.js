import { fromJS } from 'immutable';

import { getApprovalRequest } from 'control/state/approvalRequests/selectors';

import {
  APPROVAL_REQUEST,
} from '.';

import {
  INITIAL_STATE,
} from '..';


describe('getApprovalRequest', () => {
  const STATE = {
    ...INITIAL_STATE,
    newState: {
      ...INITIAL_STATE.newState,
      approvalRequests: {
        ...INITIAL_STATE.newState.approvalRequests,
        items: INITIAL_STATE.newState.approvalRequests.items.set(
          APPROVAL_REQUEST.id, fromJS(APPROVAL_REQUEST),
        ),
      },
    },
  };

  it('should return the approval request', () => {
    expect(getApprovalRequest(STATE, APPROVAL_REQUEST.id)).toEqual(fromJS(APPROVAL_REQUEST));
  });

  it('should return `null` for invalid ID', () => {
    expect(getApprovalRequest(STATE, 0)).toEqual(null);
  });

  it('should return default value for invalid ID with default provided', () => {
    expect(getApprovalRequest(STATE, 0, 'default')).toEqual('default');
  });
});
