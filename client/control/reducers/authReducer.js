import { authTokenRequest } from '../actions/authActions.js';

const initialState = {
  requestInProgress: false,
  token: null,
};

export default function authReducer(state = initialState, action) {
  switch (action.type) {

    case authTokenRequest.inProgress:
      return {
        ...state,
        requestInProgress: true,
      };

    case authTokenRequest.complete:
      return {
        ...state,
        requestInProgress: false,
        token: action.token || null,
      };

    default:
      return state;
  }
}
