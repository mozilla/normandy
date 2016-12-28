// API request configs
import * as recipeApi from 'control/api/RecipeApi';
import * as filterApi from 'control/api/FilterApi';

// request-related actions to dispatch later
import {
  requestComplete,
  requestInProgress,
} from 'control/actions/ControlActions';

// combined list of API request configs
const apiMap = {
  ...recipeApi,
  ...filterApi,
};

// API settings
const BASE_API_URL = '/api/v1/';
export const API_REQUEST_SETTINGS = {
  credentials: 'include',
  headers: {
    'X-CSRFToken': document.getElementsByTagName('html')[0].dataset.csrf,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};

/**
 * Creates an API request based on function name passed in.
 * Uses apiMap to find request config settings.
 *
 * @param  {String}  requestType Name of API request to fire
 * @param  {Object}  requestData Optional, data to pass into API call
 * @return {Promise}             API's fetch promise
 */
export default function makeApiRequest(requestType, requestData) {
  return dispatch => {
    const apiRequestFunc = apiMap[requestType];

    if (!apiRequestFunc || typeof apiRequestFunc !== 'function') {
      throw new Error(`"${requestType}" is not a valid API request function.`);
    }

    const apiRequestConfig = apiMap[requestType](requestData);

    dispatch(requestInProgress());

    const apiRequestUrl = `${BASE_API_URL}${apiRequestConfig.url}`;

    return fetch(apiRequestUrl, {
      ...API_REQUEST_SETTINGS,
      ...apiRequestConfig.settings,
    })
    .then(response => {
      if (response.status >= 400) {
        dispatch(requestComplete({
          status: 'error',
          notification: apiRequestConfig.errorNotification,
        }));
        return response.json().then(err => { throw err; });
      }
      dispatch(requestComplete({
        status: 'success',
        notification: apiRequestConfig.successNotification,
      }));
      return (response.status === 204) ? response.text : response.json();
    });
  };
}
