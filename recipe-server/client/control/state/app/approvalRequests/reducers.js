import { fromJS, Map } from 'immutable';
import { combineReducers } from 'redux';

import {
  APPROVAL_REQUEST_DELETE,
  APPROVAL_REQUEST_RECEIVE,
} from 'control/state/action-types';


function items(state = new Map(), action) {
  let approvalRequest;

  switch (action.type) {
    case APPROVAL_REQUEST_RECEIVE:
      approvalRequest = fromJS(action.approvalRequest);

      approvalRequest = approvalRequest
        .set('creator_id', approvalRequest.getIn(['creator', 'id'], null))
        .remove('creator')
        .set('approver_id', approvalRequest.getIn(['approver', 'id'], null))
        .remove('approver');

      return state.set(action.approvalRequest.id, approvalRequest);

    case APPROVAL_REQUEST_DELETE:
      return state.remove(action.approvalRequestId);

    default:
      return state;
  }
}


export default combineReducers({
  items,
});
