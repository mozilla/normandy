import { fromJS, Map } from 'immutable';
import { combineReducers } from 'redux';

import {
  RECIPE_RECEIVE,
  REVISION_RECEIVE,
} from '../action-types';


function items(state = new Map({}), action) {
  let newState;

  switch (action.type) {
    case REVISION_RECEIVE:
      return state.set(action.revision.id, fromJS(action.revision));

    case RECIPE_RECEIVE:
      newState = state.set(
        action.recipe.latest_revision.id, fromJS(action.recipe.latest_revision));

      if (action.recipe.approved_revision) {
        newState = state.set(
          action.recipe.approved_revision.id, fromJS(action.recipe.approved_revision));
      }

      return newState;

    default:
      return state;
  }
}


export default combineReducers({
  items,
});
