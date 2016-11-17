import {
  AUTH_TOKEN_REQUEST_IN_PROGRESS,
  AUTH_TOKEN_REQUEST_COMPLETE,
} from '../actions/authActions.js';

const initialState = {
  requestInProgress: false,
  token: null,
};

export default function authReducer(state = initialState, action) {
  switch (action.type) {

    case AUTH_TOKEN_REQUEST_IN_PROGRESS:
      return {
        ...state,
        requestInProgress: true,
      };

    case AUTH_TOKEN_REQUEST_COMPLETE:
      return {
        ...state,
        requestInProgress: false,
        token: action.token || null,
      };

    default:
      return state;
  }
}
