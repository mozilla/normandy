import { fromJS, Map } from 'immutable';

import {
  REQUEST_FAILURE,
  REQUEST_SEND,
  REQUEST_SUCCESS,
} from 'control/state/action-types';


export default function requests(state = new Map(), action) {
  switch (action.type) {
    case REQUEST_SEND:
      return state.set(action.requestId, new Map({
        inProgress: true,
        error: null,
      }));

    case REQUEST_SUCCESS:
      return state.set(action.requestId, new Map({
        inProgress: false,
        error: null,
      }));

    case REQUEST_FAILURE:
      return state.set(action.requestId, new Map({
        inProgress: false,
        error: fromJS(action.error),
      }));

    default:
      return state;
  }
}
