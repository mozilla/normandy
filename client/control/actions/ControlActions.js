import {
  showNotification,
} from 'control/actions/NotificationActions';

export const REQUEST_IN_PROGRESS = 'REQUEST_IN_PROGRESS';
export const REQUEST_COMPLETE = 'REQUEST_COMPLETE';

export function requestInProgress() {
  return {
    type: REQUEST_IN_PROGRESS,
  };
}

export function requestComplete(result) {
  return dispatch => {
    if (result.notification) {
      dispatch(showNotification({ messageType: result.status, message: result.notification }));
    }

    dispatch({ type: REQUEST_COMPLETE, status: result.status });
  };
}
