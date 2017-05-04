import { fromJS, Map } from 'immutable';
import { combineReducers } from 'redux';

import {
  RECIPE_RECEIVE,
  REVISION_RECEIVE,
} from '../action-types';


function reduceRevision(revision) {
  const reduced = fromJS(revision);
  reduced.setIn(['recipe', 'action_id'], revision.recipe.action.id);
  reduced.removeIn(['recipe', 'action']);
  return reduced;
}


function items(state = new Map(), action) {
  let newRevisions;

  switch (action.type) {
    case RECIPE_RECEIVE:
      newRevisions = {
        [action.recipe.latest_revision.id]: reduceRevision(action.recipe.latest_revision),
      };
      if (action.recipe.approved_revision) {
        newRevisions[action.recipe.approved_revision.id] =
          reduceRevision(action.recipe.approved_revision);
      }
      return state.merge(newRevisions);

    case REVISION_RECEIVE:
      return state.set(action.revision.id, reduceRevision(action.revision));

    default:
      return state;
  }
}


export default combineReducers({
  items,
});
