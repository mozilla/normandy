import { message as AntMessage } from 'antd';

import APIClient from 'control/utils/api';
import { ValidationError } from 'control/utils/forms';


export const ERR_MESSAGES = {
  FORM_VALIDATION: 'Please correct the form items highlighted below.',
  NO_INTERNET: 'Check your internet connection and try again.',
  SERVER_FAILED: 'The server failed to respond. Please try again.',
  NOT_LOGGED_IN: 'No active user session found, try logging in again.',
  NO_PERMISSION: 'You do not have permission to perform that action.',
};

// Search strings used to determine various types responses.
const checkFetchFailure = ({ message = '' }) =>
  message.indexOf('Failed to fetch') !== -1 || message.indexOf('NetworkError') !== -1;

const checkLoginFailure = ({ message = '' }) => message.indexOf('credentials were not provided') > -1;
const checkAPIFailure = error => error instanceof APIClient.APIError;
const checkValidationFailure = error => error instanceof ValidationError;

const msgDisplayTime = 8; // seconds

const defaultMethods = {
  checkUserOnline: () => navigator.onLine,
  notifyUser: errMsg => AntMessage.error(errMsg, msgDisplayTime),
};

const handleAPIError = error => {
  let message = '';

  switch (error.data.status) {
    case 400: // Bad Request
      message = ERR_MESSAGES.FORM_VALIDATION;
      break;

    case 403: // Forbidden
      message = checkLoginFailure(error) ? ERR_MESSAGES.NOT_LOGGED_IN : ERR_MESSAGES.NO_PERMISSION;
      break;

    case 500: // Internal Server Error
      message = `${ERR_MESSAGES.SERVER_FAILED} (${error.message})`;
      break;

    // If it's a status we aren't expecting, simply pass the server error
    // forward to the client.
    default:
      message = error.message;
      break;
  }

  return message;
};

export default function handleError(context = 'Error!', error, methodOverrides = {}) {
  const methods = { ...defaultMethods, ...methodOverrides };
  let errMsg = '';

  // This function can be used to trigger an error message without an actual Error
  // object. If an Error is given, though, we can extract a more meaningful error message.
  if (error) {
    errMsg = error.message || '';
    if (!methods.checkUserOnline()) {
      errMsg = ERR_MESSAGES.NO_INTERNET;
    } else if (checkFetchFailure(error)) {
      errMsg = ERR_MESSAGES.SERVER_FAILED;
    } else if (checkAPIFailure(error)) {
      errMsg = handleAPIError(error);
    } else if (checkValidationFailure(error)) {
      errMsg = ERR_MESSAGES.FORM_VALIDATION;
    }
  }

  const userMessage = `${context}${errMsg ? ` ${errMsg}` : ''}`;

  methods.notifyUser(userMessage);

  return {
    context,
    message: userMessage,
    reason: errMsg,
  };
}
