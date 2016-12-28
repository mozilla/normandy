export const SHOW_NOTIFICATION = 'SHOW_NOTIFICATION';
export const DISMISS_NOTIFICATION = 'DISMISS_NOTIFICATION';

/**
 * Given a notification object, dispatches a
 * 'show notification' action (which displays the message
 * on the page), waits 10 seconds, then hides the notification
 * via the 'dismissNotification' action.
 *
 * Notification object shape:
 * { messageType: <String>, message: <String> }
 *
 * @param  {Object} notification Notification message to display
 */
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

/**
 * Returns a DISMISS_NOTIFICATION object to be dispatched.
 * Ultimately removes a displayed notification from the page.
 *
 * @param  {number} notificationId Time-based ID of notification to hide
 */
export function dismissNotification(notificationId) {
  return {
    type: DISMISS_NOTIFICATION,
    notificationId,
  };
}
