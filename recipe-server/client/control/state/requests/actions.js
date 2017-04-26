/* eslint import/prefer-default-export: "off" */

import { getRequest } from './selectors';

import {
  REQUEST_FAILURE,
  REQUEST_SEND,
  REQUEST_SUCCESS,
} from '../action-types';

import apiFetch from '../../utils/apiFetch';


export function makeApiRequest(requestId, endpoint, options = {}) {
  return async (dispatch, getState) => {
    const request = getRequest(getState(), requestId);

    if (request.inProgress) { return true; }

    dispatch({
      type: REQUEST_SEND,
      requestId,
    });

    let data;

    try {
      data = await apiFetch(endpoint, options);
    } catch (error) {
      dispatch({
        type: REQUEST_FAILURE,
        requestId,
        error,
      });

      throw error;
    }

    dispatch({
      type: REQUEST_SUCCESS,
      requestId,
    });

    return data;
  };
}
