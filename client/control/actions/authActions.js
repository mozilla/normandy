import { BASE_API_URL, API_REQUEST_SETTINGS } from '../constants.js';
import { showNotification } from './ControlActions.js';

export const authTokenRequest = {
  inProgress: 'AUTH_TOKEN_REQUEST',
  complete: 'AUTH_TOKEN_REQUEST_SUCCESS',
};


export function requestAPIToken() {
  return async dispatch => {
    dispatch({ type: authTokenRequest.inProgress });
    const response = await fetch(`${BASE_API_URL}token/`, API_REQUEST_SETTINGS);
    const jsonResponse = await response.json();

    if (response.status >= 400) {
      dispatch({
        type: authTokenRequest.complete,
        status: 'error',
      });
      dispatch(showNotification('Error fetching API token'));
      throw new Error(jsonResponse);
    }

    dispatch({
      type: authTokenRequest.complete,
      status: 'success',
      token: jsonResponse,
    });
  };
}
