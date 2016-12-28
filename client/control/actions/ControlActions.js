export const REQUEST_IN_PROGRESS = 'REQUEST_IN_PROGRESS';
export const REQUEST_COMPLETE = 'REQUEST_COMPLETE';

export const SHOW_NOTIFICATION = 'SHOW_NOTIFICATION';
export const DISMISS_NOTIFICATION = 'DISMISS_NOTIFICATION';

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

export function showNotification(notification) {
  return dispatch => {
    // Use time-based id and dismiss automatically after 10 seconds.
    notification.id = notification.id || new Date().getTime();
    setTimeout(() => {
      dispatch(dismissNotification(notification.id));
    }, 10000);

    dispatch({
      type: SHOW_NOTIFICATION,
      notification,
    });
  };
}

export function dismissNotification(notificationId) {
  return {
    type: DISMISS_NOTIFICATION,
    notificationId,
  };
}
