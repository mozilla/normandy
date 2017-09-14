import {
  RECEIVED_USER_INFO,
} from 'control_old/actions/ControlActions';

const initialState = {};

function userReducer(state = initialState, action) {
  switch (action.type) {

    case RECEIVED_USER_INFO:
      return { ...action.user };

    default:
      return state;
  }
}

export default userReducer;
