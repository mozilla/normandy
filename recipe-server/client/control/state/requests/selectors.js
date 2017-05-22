/* eslint import/prefer-default-export: "off" */

import { DEFAULT_REQUEST } from '../constants';


export function getRequest(state, id, defaultsTo = DEFAULT_REQUEST) {
  return state.newState.requests.get(id, defaultsTo);
}
