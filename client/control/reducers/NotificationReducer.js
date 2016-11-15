import {
  SHOW_NOTIFICATION, DISMISS_NOTIFICATION,
} from 'actions/ControlActions';

const initialState = [];

function notificationReducer(state = initialState, action) {
  switch (action.type) {

    case SHOW_NOTIFICATION:
      return state.concat([action.notification]);

    case DISMISS_NOTIFICATION:
      return state.filter(n => n.id !== action.notificationId);

    default:
      return state;
  }
}

export default notificationReducer;
