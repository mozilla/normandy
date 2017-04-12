import { getRequest } from './selectors';

import {
  REVISION_FETCH,
  REVISION_FETCH_FAILURE,
  REVISION_FETCH_SUCCESS,
  REVISION_RECEIVE,
  REVISIONS_FETCH,
  REVISIONS_FETCH_FAILURE,
  REVISIONS_FETCH_SUCCESS,
} from '../action-types';

import apiFetch from '../../utils/apiFetch';


function fetchRevisionSuccess(dispatch, requestId, revision) {
  dispatch({
    type: REVISION_FETCH_SUCCESS,
    requestId,
  });

  dispatch({
    type: REVISION_RECEIVE,
    revision,
  });
}


function fetchRevisionFailure(dispatch, requestId, error) {
  dispatch({
    type: REVISION_FETCH_FAILURE,
    error,
    requestId,
  });
}


export function fetchRevision(pk) {
  return (dispatch, getState) => {
    const requestId = `fetch-${pk}`;
    const request = getRequest(getState(), requestId);

    if (request.loading) { return true; }

    dispatch({
      type: REVISION_FETCH,
      requestId,
    });

    return apiFetch(`recipe_revision/${pk}/`, { method: 'GET' })
      .then(revision => fetchRevisionSuccess(dispatch, requestId, revision))
      .catch(error => fetchRevisionFailure(dispatch, requestId, error));
  };
}


function fetchRevisionsSuccess(dispatch, requestId, revisions) {
  dispatch({
    type: REVISIONS_FETCH_SUCCESS,
    requestId,
  });

  revisions.forEach(revision => {
    dispatch({
      type: REVISION_RECEIVE,
      revision,
    });
  });
}


function fetchRevisionsFailure(dispatch, requestId, error) {
  dispatch({
    type: REVISIONS_FETCH_FAILURE,
    error,
    requestId,
  });
}


export function fetchRevisions() {
  return (dispatch, getState) => {
    const requestId = 'fetch';
    const request = getRequest(getState(), requestId);

    if (request.loading) { return true; }

    dispatch({
      type: REVISIONS_FETCH,
      requestId,
    });

    return apiFetch('recipe_revision/', { method: 'GET' })
      .then(revisions => fetchRevisionsSuccess(dispatch, requestId, revisions))
      .catch(error => fetchRevisionsFailure(dispatch, requestId, error));
  };
}
