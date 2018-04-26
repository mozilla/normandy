import { fromJS } from 'immutable';
import * as matchers from 'jasmine-immutable-matchers';

import {
  APPROVAL_REQUEST_RECEIVE,
  USER_RECEIVE,
} from 'control/state/action-types';
import approvalRequestsReducer from 'control/state/app/approvalRequests/reducers';
import { getApprovalRequest } from 'control/state/app/approvalRequests/selectors';
import usersReducer from 'control/state/app/users/reducers';
import {
  INITIAL_STATE,
} from 'control/tests/state';
import {
  ApprovalRequestFactory,
} from 'control/tests/state/approvalRequests';


describe('getApprovalRequest', () => {
  const approvalRequest = ApprovalRequestFactory.build();

  const STATE = {
    ...INITIAL_STATE,
    app: {
      ...INITIAL_STATE.app,
      approvalRequests: approvalRequestsReducer(undefined, {
        type: APPROVAL_REQUEST_RECEIVE,
        approvalRequest,
      }),
      users: usersReducer(undefined, {
        type: USER_RECEIVE,
        user: approvalRequest.creator,
      }),
    },
  };

  beforeEach(() => {
    jasmine.addMatchers(matchers);
  });

  it('should return the approval request', () => {
    expect(getApprovalRequest(STATE, approvalRequest.id)).toEqualImmutable(
      fromJS(approvalRequest),
    );
  });

  it('should return `null` for invalid ID', () => {
    expect(getApprovalRequest(STATE, 0)).toEqual(null);
  });

  it('should return default value for invalid ID with default provided', () => {
    expect(getApprovalRequest(STATE, 0, 'default')).toEqual('default');
  });
});
