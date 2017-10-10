/* eslint import/prefer-default-export: "off" */

import { List, Map } from 'immutable';
import * as localForage from 'localforage';

import { getNamedRoute } from 'control/routes';
import {
  SESSION_INFO_RECEIVE,
  SESSION_INFO_HISTORY_VIEW,
  REQUEST_SEND,
  REQUEST_SUCCESS,
} from 'control/state/action-types';

const STORAGE_KEY = 'normandy-sesh-info';

export function fetchSessionInfo() {
  return async dispatch => {
    const requestId = 'fetch-session-info';
    dispatch({
      type: REQUEST_SEND,
      requestId,
    });

    // Read the stringified object and convert it (and its nested objects) into
    // proper immutable objects.
    let savedHistory = await localForage.getItem(STORAGE_KEY);

    if (!savedHistory) {
      savedHistory = [];
    }
    savedHistory = savedHistory.map(obj => new Map(obj));
    savedHistory = new List(savedHistory);


    dispatch({
      type: REQUEST_SUCCESS,
      requestId,
    });

    dispatch({
      type: SESSION_INFO_RECEIVE,
      history: savedHistory,
    });
  };
}

export function saveSession() {
  return async (dispatch, getState) => {
    const requestId = 'save-session-info';
    dispatch({
      type: REQUEST_SEND,
      requestId,
    });

    const storedData = getState().app.session.history.toJS();
    await localForage.setItem(STORAGE_KEY, storedData);

    dispatch({
      type: REQUEST_SUCCESS,
      requestId,
    });
  };
}

export function addSessionView(category, caption, identicon) {
  return async (dispatch, getState) => {
    const { router } = getState();
    let url = router.pathname;

    // If the route we are currently on has defined another slug to use for
    // 'session' purposes, use that instead.
    const slugRedirect = router.result && router.result.sessionSlug;

    if (slugRedirect) {
      url = getNamedRoute(slugRedirect, router.params);
    }

    dispatch({
      type: SESSION_INFO_HISTORY_VIEW,
      item: new Map({ url, caption, category, identicon }),
    });

    // Automatically save the session when views are added.
    return dispatch(saveSession());
  };
}
