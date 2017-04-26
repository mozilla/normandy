import {
  ACTION_RECEIVE,
} from '../action-types';

import {
  makeApiRequest,
} from '../requests/actions';


function receiveAction(action) {
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
    .then(action => receiveAction(action));
}


function receiveAllActions(actions) {
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
    .then(actions => receiveAllActions(actions));
}
