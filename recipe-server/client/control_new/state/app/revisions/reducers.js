import { fromJS, Map } from 'immutable';
import { combineReducers } from 'redux';

import {
  APPROVAL_REQUEST_CREATE,
  APPROVAL_REQUEST_DELETE,
  RECIPE_DELETE,
  REVISION_RECEIVE,
} from 'control_new/state/action-types';


function items(state = new Map(), action) {
  let revision;

  switch (action.type) {
    case REVISION_RECEIVE:
      revision = fromJS(action.revision);
      revision = revision
        .setIn(['recipe', 'action_id'], revision.getIn(['recipe', 'action', 'id'], null))
        .removeIn(['recipe', 'action'])
        .set('approval_request_id', revision.getIn(['approval_request', 'id'], null))
        .remove('approval_request')
        .set('user_id', revision.getIn(['user', 'id'], null))
        .remove('user');

      return state.set(action.revision.id, revision);

    case RECIPE_DELETE:
      return state.filterNot(item => item.getIn(['recipe', 'id']) === action.recipeId);

    case APPROVAL_REQUEST_CREATE:
      return state.update(action.revisionId, item => (
        item.set('approval_request_id', action.approvalRequest.id)
      ));

    case APPROVAL_REQUEST_DELETE:
      return state.map(item => {
        if (item.get('approval_request_id') === action.approvalRequestId) {
          return item.set('approval_request_id', null);
        }
        return item;
      });

    default:
      return state;
  }
}


export default combineReducers({
  items,
});
