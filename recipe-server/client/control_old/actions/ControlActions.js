import { showNotification } from 'control_old/actions/NotificationActions';

export const REQUEST_IN_PROGRESS = 'REQUEST_IN_PROGRESS';
export const REQUEST_COMPLETE = 'REQUEST_COMPLETE';
export const RECEIVED_USER_INFO = 'RECEIVED_USER_INFO';

export function userInfoReceived(user) {
  return {
    type: RECEIVED_USER_INFO,
    user,
  };
}

export function requestInProgress() {
  return {
    type: REQUEST_IN_PROGRESS,
  };
}

export function requestComplete(result) {
  return dispatch => {
    if (result.notification) {
      dispatch(showNotification({
        messageType: result.status,
        message: result.notification,
      }));
    }

    dispatch({ type: REQUEST_COMPLETE, status: result.status });
  };
}
