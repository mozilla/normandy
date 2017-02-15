// request-related actions to dispatch later
import {
  requestComplete,
  requestInProgress,
} from 'control/actions/ControlActions';

// API request configs
import * as recipeApi from 'control/api/RecipeApi';
import * as filterApi from 'control/api/FilterApi';

// Combined list of API request configs
const apiMap = {
  ...recipeApi,
  ...filterApi,
};

// Root URL for API requests
const BASE_API_URL = '/api/v1/';

// Default API request settings
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

    // throw an error if the API request doesn't exist or is invalid
    if (!apiRequestFunc || typeof apiRequestFunc !== 'function') {
      throw new Error(`"${requestType}" is not a valid API request function.`);
    }

    // get the config object for this request type
    const apiRequestConfig = apiMap[requestType](requestData);

    // alert the app we're requesting
    dispatch(requestInProgress());

    // the request config URL is just attached to the base API
    const apiRequestUrl = `${BASE_API_URL}${apiRequestConfig.url}`;

    // perform the actual request
    // (settings are API defaults + any from the config)
    return fetch(apiRequestUrl, {
      ...API_REQUEST_SETTINGS,
      ...apiRequestConfig.settings,
    })
    // handler
    .then(response => {
      // if the response was not something good,
      // display an in-app error, along with the config's
      // custom error messaging
      if (response.status >= 400) {
        dispatch(requestComplete({
          status: 'error',
          notification: apiRequestConfig.errorNotification,
        }));
        return response.json().then(err => { throw err; });
      }

      // if we're all good, notify the app the request is done,
      // and return the 'success' message from the config
      dispatch(requestComplete({
        status: 'success',
        notification: apiRequestConfig.successNotification,
      }));

      // finally, return the response (text or data, based on the status)
      return (response.status === 204) ? response.text : response.json();
    });
  };
}
