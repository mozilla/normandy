/* eslint import/prefer-default-export: "off" */

import { getRequest } from 'control_new/state/app/requests/selectors';

import {
  REQUEST_FAILURE,
  REQUEST_SEND,
  REQUEST_SUCCESS,
} from 'control_new/state/action-types';

import APIClient from 'control_new/utils/api';


export function makeApiRequest(requestId, endpoint, options = {}) {
  return async (dispatch, getState) => {
    const request = getRequest(getState(), requestId);
    if (request.inProgress) { return true; }
    let root;
    if ('root' in options) {
      root = options.root;
      delete options.root;
    }

    const api = new APIClient(root);

    dispatch({
      type: REQUEST_SEND,
      requestId,
    });

    let data;

    try {
      data = await api.fetch(endpoint, options);
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
