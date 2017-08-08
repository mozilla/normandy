import {
  ACTION_RECEIVE,
} from 'control_new/state/action-types';
import {
  makeApiRequest,
} from 'control_new/state/app/requests/actions';


export function fetchAction(pk) {
  return async dispatch => {
    const requestId = `fetch-action-${pk}`;
    const action = await dispatch(makeApiRequest(requestId, `v2/action/${pk}/`));

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
