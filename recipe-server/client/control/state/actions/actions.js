import {
  ACTION_RECEIVE,
} from '../action-types';

import {
  makeApiRequest,
} from '../requests/actions';


export function fetchAction(name) {
  return async dispatch => {
    const requestId = `fetch-action-${name}`;
    const response = dispatch(makeApiRequest(requestId, `action/${name}/`, { method: 'GET' }));
    const action = await response;

    dispatch({
      type: ACTION_RECEIVE,
      action,
    });
  };
}


export function fetchAllActions() {
  return async dispatch => {
    const requestId = 'fetch-all-actions';
    const response = dispatch(makeApiRequest(requestId, 'action/', { method: 'GET' }));
    const actions = await response;

    actions.forEach(action => {
      dispatch({
        type: ACTION_RECEIVE,
        action,
      });
    });
  };
}
