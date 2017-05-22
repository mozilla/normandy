import { fromJS, Map } from 'immutable';
import { combineReducers } from 'redux';

import {
  RECIPE_DELETE,
  REVISION_RECEIVE,
} from '../action-types';


function items(state = new Map(), action) {
  let revision;

  switch (action.type) {
    case REVISION_RECEIVE:
      revision = fromJS(action.revision);
      revision = revision
        .setIn(['recipe', 'action_id'], revision.getIn(['recipe', 'action', 'id'], null))
        .removeIn(['recipe', 'action']);

      return state.set(action.revision.id, revision);

    case RECIPE_DELETE:
      return state.filterNot(item => item.getIn(['recipe', 'id']) === action.recipeId);

    default:
      return state;
  }
}


export default combineReducers({
  items,
});
