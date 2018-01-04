import { fromJS, Map } from 'immutable';
import { combineReducers } from 'redux';

import {
  APPROVAL_REQUEST_DELETE,
  APPROVAL_REQUEST_RECEIVE,
  RECIPE_HISTORY_RECEIVE,
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

    case RECIPE_HISTORY_RECEIVE: {
      const revisions = fromJS(action.revisions);

      return state.withMutations(mutState => {
        revisions.forEach(revision => {
          const approvalId = revision.getIn(['approval_request', 'id'], null);
          if (approvalId) {
            mutState.set(approvalId, revision.get('approval_request'));
          }
        });
      });
    }

    case APPROVAL_REQUEST_DELETE:
      return state.remove(action.approvalRequestId);

    default:
      return state;
  }
}


export default combineReducers({
  items,
});
