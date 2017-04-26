/* eslint import/prefer-default-export: "off" */

import { getRequest } from './selectors';

import {
  REQUEST_FAILURE,
  REQUEST_SEND,
  REQUEST_SUCCESS,
} from '../action-types';

import apiFetch from '../../utils/apiFetch';


function requestSuccess(requestId, data) {
  return dispatch => {
    dispatch({
      type: REQUEST_SUCCESS,
      requestId,
    });

    return data;
  };
}


function requestFailure(requestId, error) {
  return dispatch => {
    dispatch({
      type: REQUEST_FAILURE,
      requestId,
      error,
    });

    throw error;
  };
}


export function makeApiRequest(requestId, endpoint, options = {}) {
  return (dispatch, getState) => {
    const request = getRequest(getState(), requestId);

    if (request.inProgress) { return true; }

    dispatch({
      type: REQUEST_SEND,
      requestId,
    });

    return apiFetch(endpoint, options)
      .then(data => requestSuccess(requestId, data))
      .catch(error => requestFailure(requestId, error));
  };
}
