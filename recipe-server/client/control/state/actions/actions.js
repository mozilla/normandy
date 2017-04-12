import { getRequest } from './selectors';

import {
  ACTION_FETCH,
  ACTION_FETCH_FAILURE,
  ACTION_FETCH_SUCCESS,
  ACTION_RECEIVE,
  ACTIONS_FETCH,
  ACTIONS_FETCH_FAILURE,
  ACTIONS_FETCH_SUCCESS,
} from '../action-types';

import apiFetch from '../../utils/apiFetch';


function fetchActionSuccess(dispatch, requestId, action) {
  dispatch({
    type: ACTION_FETCH_SUCCESS,
    requestId,
  });

  dispatch({
    type: ACTION_RECEIVE,
    action,
  });
}


function fetchActionFailure(dispatch, requestId, error) {
  dispatch({
    type: ACTION_FETCH_FAILURE,
    error,
    requestId,
  });
}


export function fetchAction(name) {
  return (dispatch, getState) => {
    const requestId = `fetch-${name}`;
    const request = getRequest(getState(), requestId);

    if (request.loading) { return true; }

    dispatch({
      type: ACTION_FETCH,
      requestId,
    });

    return apiFetch(`action/${name}/`, { method: 'GET' })
      .then(action => fetchActionSuccess(dispatch, requestId, action))
      .catch(error => fetchActionFailure(dispatch, requestId, error));
  };
}


function fetchActionsSuccess(dispatch, requestId, actions) {
  dispatch({
    type: ACTIONS_FETCH_SUCCESS,
    requestId,
  });

  actions.forEach(action => {
    dispatch({
      type: ACTION_RECEIVE,
      action,
    });
  });
}


function fetchActionsFailure(dispatch, requestId, error) {
  dispatch({
    type: ACTIONS_FETCH_FAILURE,
    error,
    requestId,
  });
}


export function fetchActions() {
  return (dispatch, getState) => {
    const requestId = 'fetch';
    const request = getRequest(getState(), requestId);

    if (request.loading) { return true; }

    dispatch({
      type: ACTIONS_FETCH,
      requestId,
    });

    return apiFetch('action/', { method: 'GET' })
      .then(actions => fetchActionsSuccess(dispatch, requestId, actions))
      .catch(error => fetchActionsFailure(dispatch, requestId, error));
  };
}
