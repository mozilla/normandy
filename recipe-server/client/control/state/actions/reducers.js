import { fromJS, Map } from 'immutable';
import { combineReducers } from 'redux';

import {
  ACTION_RECEIVE,
  RECIPE_RECEIVE,
  REVISION_RECEIVE,
} from '../action-types';


function items(state = new Map(), action) {
  let newActions;

  switch (action.type) {
    case ACTION_RECEIVE:
      return state.set(action.action.id, fromJS(action.action));

    case RECIPE_RECEIVE:
      newActions = {
        [action.recipe.latest_revision.action.id]: fromJS(action.recipe.latest_revision.action),
      };
      if (action.recipe.approved_revision) {
        newActions[action.recipe.approved_revision.action.id] =
          fromJS(action.recipe.approved_revision.action);
      }
      return state.merge(newActions);

    case REVISION_RECEIVE:
      return state.set(action.revision.recipe.action.id, fromJS(action.revision.recipe.action));

    default:
      return state;
  }
}


export default combineReducers({
  items,
});
