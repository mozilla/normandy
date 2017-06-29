/* eslint import/prefer-default-export: "off" */
import { Map } from 'immutable';

import { DEFAULT_REQUEST } from 'control_new/state/constants';


export function getRequest(state, id, defaultsTo = DEFAULT_REQUEST) {
  return state.app.requests.get(id, defaultsTo);
}


export function isRequestInProgress(state, id) {
  const request = getRequest(state, id);
  return request.get('inProgress');
}


export function areAnyRequestsInProgress(state) {
  if (state.app.requests.size === 0) {
    return false;
  } else if (state.app.requests.size === 1) {
    return state.app.requests.first().get('inProgress');
  }

  return state.app.requests.reduce((reduced, value) => {
    const boolValue = reduced instanceof Map ? reduced.get('inProgress') : reduced;
    return boolValue || value.get('inProgress');
  });
}
