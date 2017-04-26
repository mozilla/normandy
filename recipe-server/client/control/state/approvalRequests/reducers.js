import { fromJS, Map } from 'immutable';
import { combineReducers } from 'redux';

import {
  APPROVAL_REQUEST_RECEIVE,
} from '../action-types';


function items(state = new Map({}), action) {
  switch (action.type) {
    case APPROVAL_REQUEST_RECEIVE:
      return state.set(action.approvalRequest.id, fromJS(action.approvalRequest));

    default:
      return state;
  }
}


export default combineReducers({
  items,
});
