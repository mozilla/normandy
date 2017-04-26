import {
  APPROVAL_REQUEST_RECEIVE,
} from '../action-types';

import {
  makeApiRequest,
} from '../requests/actions';


function receiveApprovalRequest(approvalRequest) {
  return dispatch => {
    dispatch({
      type: APPROVAL_REQUEST_RECEIVE,
      approvalRequest,
    });
  };
}


export function fetchApprovalRequest(pk) {
  const requestId = `fetch-${pk}`;
  return makeApiRequest(requestId, `approval_request/${pk}/`, { method: 'GET' })
    .then(approvalRequest => receiveApprovalRequest(approvalRequest));
}


function receiveAllApprovalRequests(approvalRequests) {
  return dispatch => {
    approvalRequests.forEach(approvalRequest => {
      dispatch({
        type: APPROVAL_REQUEST_RECEIVE,
        approvalRequest,
      });
    });
  };
}


export function fetchAllApprovalRequests() {
  const requestId = 'fetch-all';
  return makeApiRequest(requestId, 'approval_request/', { method: 'GET' })
    .then(approvalRequests => receiveAllApprovalRequests(approvalRequests));
}
