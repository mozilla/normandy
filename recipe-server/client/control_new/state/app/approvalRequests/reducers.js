import { fromJS, Map } from 'immutable';
import { combineReducers } from 'redux';

import {
  APPROVAL_REQUEST_DELETE,
  APPROVAL_REQUEST_RECEIVE,
} from 'control_new/state/action-types';


function items(state = new Map(), action) {
  switch (action.type) {
    case APPROVAL_REQUEST_RECEIVE:
      return state.set(action.approvalRequest.id, fromJS(action.approvalRequest));

    case APPROVAL_REQUEST_DELETE:
      return state.remove(action.approvalRequestId);

    default:
      return state;
  }
}


export default combineReducers({
  items,
});
