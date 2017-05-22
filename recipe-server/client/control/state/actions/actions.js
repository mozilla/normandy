import {
  ACTION_RECEIVE,
} from '../action-types';

import {
  makeApiRequest,
} from '../requests/actions';


export function fetchAction(name) {
  return async dispatch => {
    const requestId = `fetch-action-${name}`;
    const action = await dispatch(makeApiRequest(requestId, `v2/action/${name}/`));

    dispatch({
      type: ACTION_RECEIVE,
      action,
    });
  };
}


export function fetchAllActions() {
  return async dispatch => {
    const requestId = 'fetch-all-actions';
    const actions = await dispatch(makeApiRequest(requestId, 'v2/action/'));

    actions.forEach(action => {
      dispatch({
        type: ACTION_RECEIVE,
        action,
      });
    });
  };
}
