import {
  APPROVAL_REQUEST_DELETE,
  APPROVAL_REQUEST_RECEIVE,
} from '../action-types';

import {
  makeApiRequest,
} from '../requests/actions';


export function fetchApprovalRequest(pk) {
  return async dispatch => {
    const requestId = `fetch-approval-request-${pk}`;
    const response = dispatch(makeApiRequest(requestId, `v2/approval_request/${pk}/`));
    const approvalRequest = await response;

    dispatch({
      type: APPROVAL_REQUEST_RECEIVE,
      approvalRequest,
    });
  };
}


export function fetchAllApprovalRequests() {
  return async dispatch => {
    const requestId = 'fetch-all-approval-requests';
    const approvalRequests = await dispatch(makeApiRequest(requestId, 'v2/approval_request/'));

    approvalRequests.forEach(approvalRequest => {
      dispatch({
        type: APPROVAL_REQUEST_RECEIVE,
        approvalRequest,
      });
    });
  };
}


export function approveApprovalRequest(pk) {
  return async dispatch => {
    const requestId = `approve-approval-request-${pk}`;
    const approvalRequest = await dispatch(
      makeApiRequest(requestId, `v2/approval_request/${pk}/approve/`, {
        method: 'POST',
      }));

    dispatch({
      type: APPROVAL_REQUEST_RECEIVE,
      approvalRequest,
    });
  };
}


export function rejectApprovalRequest(pk) {
  return async dispatch => {
    const requestId = `reject-approval-request-${pk}`;
    const approvalRequest = await dispatch(
      makeApiRequest(requestId, `v2/approval_request/${pk}/reject/`, {
        method: 'POST',
      }));

    dispatch({
      type: APPROVAL_REQUEST_RECEIVE,
      approvalRequest,
    });
  };
}


export function closeApprovalRequest(pk) {
  return async dispatch => {
    const requestId = `close-approval-request-${pk}`;

    await dispatch(makeApiRequest(requestId, `v2/approval_request/${pk}/close/`, {
      method: 'POST',
    }));

    dispatch({
      type: APPROVAL_REQUEST_DELETE,
      approvalRequestId: pk,
    });
  };
}
