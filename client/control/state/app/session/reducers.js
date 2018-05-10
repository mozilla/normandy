import { is, List } from 'immutable';
import { combineReducers } from 'redux';

import {
  SESSION_INFO_RECEIVE,
  SESSION_INFO_HISTORY_VIEW,
} from 'control/state/action-types';

export function history(state = new List(), action) {
  switch (action.type) {
    case SESSION_INFO_RECEIVE:
      return new List(action.history || []);

    case SESSION_INFO_HISTORY_VIEW: {
      const newState = state.filter(item => !is(item, action.item));
      return newState.unshift(action.item);
    }

    default:
      return state;
  }
}

export default combineReducers({
  history,
});
