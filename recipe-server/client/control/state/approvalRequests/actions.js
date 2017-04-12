import { getRequest } from './selectors';

import {
  APPROVAL_REQUEST_FETCH,
  APPROVAL_REQUEST_FETCH_FAILURE,
  APPROVAL_REQUEST_FETCH_SUCCESS,
  APPROVAL_REQUEST_RECEIVE,
  APPROVAL_REQUESTS_FETCH,
  APPROVAL_REQUESTS_FETCH_FAILURE,
  APPROVAL_REQUESTS_FETCH_SUCCESS,
} from '../action-types';

import apiFetch from '../../utils/apiFetch';


function fetchApprovalRequestSuccess(dispatch, requestId, approvalRequest) {
  dispatch({
    type: APPROVAL_REQUEST_FETCH_SUCCESS,
    requestId,
  });

  dispatch({
    type: APPROVAL_REQUEST_RECEIVE,
    approvalRequest,
  });
}


function fetchApprovalRequestFailure(dispatch, requestId, error) {
  dispatch({
    type: APPROVAL_REQUEST_FETCH_FAILURE,
    error,
    requestId,
  });
}


export function fetchApprovalRequest(pk) {
  return (dispatch, getState) => {
    const requestId = `fetch-${pk}`;
    const request = getRequest(getState(), requestId);

    if (request.loading) { return true; }

    dispatch({
      type: APPROVAL_REQUEST_FETCH,
      requestId,
    });

    return apiFetch(`approval_request/${pk}/`, { method: 'GET' })
      .then(approvalRequest => fetchApprovalRequestSuccess(dispatch, requestId, approvalRequest))
      .catch(error => fetchApprovalRequestFailure(dispatch, requestId, error));
  };
}

function fetchApprovalRequestsSuccess(dispatch, requestId, approvalRequests) {
  dispatch({
    type: APPROVAL_REQUESTS_FETCH_SUCCESS,
    requestId,
  });

  approvalRequests.forEach(approvalRequest => {
    dispatch({
      type: APPROVAL_REQUEST_RECEIVE,
      approvalRequest,
    });
  });
}


function fetchApprovalRequestsFailure(dispatch, requestId, error) {
  dispatch({
    type: APPROVAL_REQUESTS_FETCH_FAILURE,
    error,
    requestId,
  });
}


export function fetchApprovalRequests() {
  return (dispatch, getState) => {
    const requestId = 'fetch';
    const request = getRequest(getState(), requestId);

    if (request.loading) { return true; }

    dispatch({
      type: APPROVAL_REQUESTS_FETCH,
      requestId,
    });

    return apiFetch('approval_request/', { method: 'GET' })
      .then(approvalRequests => fetchApprovalRequestsSuccess(dispatch, requestId, approvalRequests))
      .catch(error => fetchApprovalRequestsFailure(dispatch, requestId, error));
  };
}
