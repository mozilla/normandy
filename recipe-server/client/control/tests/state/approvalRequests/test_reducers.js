import { fromJS } from 'immutable';

import {
  APPROVAL_REQUEST_DELETE,
  APPROVAL_REQUEST_RECEIVE,
} from 'control/state/action-types';
import approvalRequestsReducer from 'control/state/approvalRequests/reducers';

import {
  INITIAL_STATE,
  APPROVAL_REQUEST,
} from '.';


describe('Approval requests reducer', () => {
  it('should return initial state by default', () => {
    expect(approvalRequestsReducer(undefined, {})).toEqual(INITIAL_STATE);
  });

  it('should handle APPROVAL_REQUEST_RECEIVE', () => {
    expect(approvalRequestsReducer(undefined, {
      type: APPROVAL_REQUEST_RECEIVE,
      approvalRequest: APPROVAL_REQUEST,
    })).toEqual({
      ...INITIAL_STATE,
      items: INITIAL_STATE.items.set(APPROVAL_REQUEST.id, fromJS(APPROVAL_REQUEST)),
    });
  });

  it('should handle APPROVAL_REQUEST_DELETE', () => {
    const state = approvalRequestsReducer(undefined, {
      type: APPROVAL_REQUEST_RECEIVE,
      approvalRequest: APPROVAL_REQUEST,
    });

    const updatedState = approvalRequestsReducer(state, {
      type: APPROVAL_REQUEST_DELETE,
      approvalRequestId: APPROVAL_REQUEST.id,
    });

    expect(updatedState).toEqual(INITIAL_STATE);
  });
});
