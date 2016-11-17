import { BASE_API_URL, API_REQUEST_SETTINGS } from '../constants.js';
import { showNotification } from './ControlActions.js';

export const AUTH_TOKEN_REQUEST_IN_PROGRESS = 'AUTH_TOKEN_REQUEST';
export const AUTH_TOKEN_REQUEST_COMPLETE = 'AUTH_TOKEN_REQUEST_SUCCESS';


export function requestAPIToken() {
  return async dispatch => {
    dispatch({ type: AUTH_TOKEN_REQUEST_IN_PROGRESS });
    const response = await fetch(`${BASE_API_URL}token/`, API_REQUEST_SETTINGS);

    if (response.status >= 400) {
      dispatch({
        type: AUTH_TOKEN_REQUEST_COMPLETE,
        status: 'error',
      });
      dispatch(showNotification('Error fetching API token'));
      throw await response.json();
    }

    const token = await response.json();

    dispatch({
      type: AUTH_TOKEN_REQUEST_COMPLETE,
      status: 'success',
      token,
    });
  };
}
