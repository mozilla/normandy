import { fromJS, Map } from 'immutable';
import { combineReducers } from 'redux';

import {
  EXTENSION_RECEIVE,
} from '../action-types';


function items(state = new Map(), action) {
  switch (action.type) {
    case EXTENSION_RECEIVE:
      return state.set(action.extension.id, fromJS(action.extension));

    default:
      return state;
  }
}


export default combineReducers({
  items,
});
