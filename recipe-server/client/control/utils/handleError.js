import { message } from 'antd';

import APIClient from 'control/utils/api';


export const ERR_MESSAGES = {
  FORM_VALIDATION: 'Please correct the form items highlighted below.',
  NO_INTERNET: 'Check your internet connection and try again.',
  SERVER_FAILED: 'The server failed to respond. Please try again.',
};

// String to search for to determine if a fetch failed. Unlikely to change.
const fetchFailureMessage = 'Failed to fetch';

const defaultMethods = {
  checkUserOnline: () => navigator.onLine,
  notifyUser: errMsg => message.error(errMsg),
};

export default function handleError(context = 'Error!', error, methodOverrides = {}) {
  const methods = { ...defaultMethods, ...methodOverrides };
  let errMsg = '';

  if (error) {
    if (!methods.checkUserOnline()) {
      errMsg = ERR_MESSAGES.NO_INTERNET;
    } else if (error.message.indexOf(fetchFailureMessage) > -1) {
      errMsg = ERR_MESSAGES.SERVER_FAILED;
    } else if (error instanceof APIClient.APIError && error.data) {
      errMsg = ERR_MESSAGES.FORM_VALIDATION;
    } else {
      errMsg = error.message;
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
