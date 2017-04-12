import { fromJS, Map } from 'immutable';
import { combineReducers } from 'redux';

import {
  ACTION_FETCH,
  ACTION_FETCH_FAILURE,
  ACTION_FETCH_SUCCESS,
  ACTION_RECEIVE,
  ACTIONS_FETCH,
  ACTIONS_FETCH_FAILURE,
  ACTIONS_FETCH_SUCCESS,
} from '../action-types';


function objects(state = Map({}), action) {
  switch (action.type) {
    case ACTION_RECEIVE:
      return state.update(action.action.id, fromJS(action.action));

    default:
      return state;
  }
}


function requests(state = Map({}), action) {
  switch (action.type) {
    case ACTION_FETCH:
    case ACTIONS_FETCH:
      return state.set(action.requestId, Map({
        loading: true,
        error: null,
      }));

    case ACTION_FETCH_SUCCESS:
    case ACTIONS_FETCH_SUCCESS:
      return state.set(action.requestId, Map({
        loading: false,
        error: null,
      }));

    case ACTION_FETCH_FAILURE:
    case ACTIONS_FETCH_FAILURE:
      return state.set(action.requestId, Map({
        loading: false,
        error: action.error,
      }));

    default:
      return state;
  }
}


export default combineReducers({
  objects,
  requests,
});
