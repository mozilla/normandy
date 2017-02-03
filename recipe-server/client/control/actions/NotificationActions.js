export const SHOW_NOTIFICATION = 'SHOW_NOTIFICATION';
export const DISMISS_NOTIFICATION = 'DISMISS_NOTIFICATION';

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
