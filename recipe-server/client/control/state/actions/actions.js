import {
  ACTION_RECEIVE,
} from '../action-types';

import {
  makeApiRequest,
} from '../requests/actions';


function fetchActionSuccess(action) {
  return dispatch => {
    dispatch({
      type: ACTION_RECEIVE,
      action,
    });
  };
}


export function fetchAction(name) {
  const requestId = `fetch-${name}`;
  return makeApiRequest(requestId, `action/${name}/`, { method: 'GET' })
    .then(action => fetchActionSuccess(action));
}


function fetchAllActionsSuccess(actions) {
  return dispatch => {
    actions.forEach(action => {
      dispatch({
        type: ACTION_RECEIVE,
        action,
      });
    });
  };
}


export function fetchAllActions() {
  const requestId = 'fetch-all';
  return makeApiRequest(requestId, 'action/', { method: 'GET' })
    .then(actions => fetchAllActionsSuccess(actions));
}
