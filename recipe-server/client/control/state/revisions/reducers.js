import { fromJS, Map } from 'immutable';
import { combineReducers } from 'redux';

import {
  REVISION_RECEIVE,
} from '../action-types';


function items(state = new Map(), action) {
  let revision;

  switch (action.type) {
    case REVISION_RECEIVE:
      revision = fromJS(action.revision);
      revision = revision.setIn(['recipe', 'action_id'], action.revision.recipe.action.id);
      revision = revision.removeIn(['recipe', 'action']);

      return state.set(action.revision.id, revision);

    default:
      return state;
  }
}


export default combineReducers({
  items,
});
