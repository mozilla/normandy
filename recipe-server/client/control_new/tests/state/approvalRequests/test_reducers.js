import { fromJS } from 'immutable';

import {
  APPROVAL_REQUEST_DELETE,
  APPROVAL_REQUEST_RECEIVE,
} from 'control_new/state/action-types';
import approvalRequestsReducer from 'control_new/state/app/approvalRequests/reducers';
import {
  INITIAL_STATE,
  ApprovalRequestFactory,
} from 'control_new/tests/state/approvalRequests';


describe('Approval requests reducer', () => {
  const approvalRequest = ApprovalRequestFactory.build();

  it('should return initial state by default', () => {
    expect(approvalRequestsReducer(undefined, {})).toEqual(INITIAL_STATE);
  });

  it('should handle APPROVAL_REQUEST_RECEIVE', () => {
    expect(approvalRequestsReducer(undefined, {
      type: APPROVAL_REQUEST_RECEIVE,
      approvalRequest,
    })).toEqual({
      ...INITIAL_STATE,
      items: INITIAL_STATE.items.set(approvalRequest.id, fromJS(approvalRequest)),
    });
  });

  it('should handle APPROVAL_REQUEST_DELETE', () => {
    const state = approvalRequestsReducer(undefined, {
      type: APPROVAL_REQUEST_RECEIVE,
      approvalRequest,
    });

    const updatedState = approvalRequestsReducer(state, {
      type: APPROVAL_REQUEST_DELETE,
      approvalRequestId: approvalRequest.id,
    });

    expect(updatedState).toEqual(INITIAL_STATE);
  });
});
