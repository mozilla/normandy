/* eslint-disable import/prefer-default-export */

export function getCurrentUser() {
  return {
    url: 'user/me/',
    settings: {
      method: 'GET',
    },
    errorNotification: 'Error retrieving user info.',
  };
}
