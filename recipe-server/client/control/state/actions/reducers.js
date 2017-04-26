import { fromJS, Map } from 'immutable';
import { combineReducers } from 'redux';

import {
  ACTION_RECEIVE,
} from '../action-types';


function items(state = new Map({}), action) {
  switch (action.type) {
    case ACTION_RECEIVE:
      return state.set(action.action.id, fromJS(action.action));

    default:
      return state;
  }
}


export default combineReducers({
  items,
});
