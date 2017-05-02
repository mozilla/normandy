import { fromJS, Map } from 'immutable';
import { combineReducers } from 'redux';

import {
  REVISION_RECEIVE,
} from '../action-types';


function items(state = new Map({}), action) {
  switch (action.type) {
    case REVISION_RECEIVE:
      return state.set(action.revision.id, fromJS(action.revision));

    default:
      return state;
  }
}


export default combineReducers({
  items,
});
