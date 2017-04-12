import { fromJS, Map } from 'immutable';
import { combineReducers } from 'redux';

import {
  REVISION_FETCH,
  REVISION_FETCH_FAILURE,
  REVISION_FETCH_SUCCESS,
  REVISION_RECIEVE,
  REVISIONS_FETCH,
  REVISIONS_FETCH_FAILURE,
  REVISIONS_FETCH_SUCCESS,
} from '../action-types';


function objects(state = Map({}), action) {
  switch (action.type) {
    case REVISION_RECIEVE:
      return state.set(action.revision.id, fromJS(action.revision));

    default:
      return state;
  }
}


function requests(state = Map({}), action) {
  switch (action.type) {
    case REVISION_FETCH:
    case REVISIONS_FETCH:
      return state.set(action.requestId, Map({
        loading: true,
        error: null,
      }));

    case REVISION_FETCH_SUCCESS:
    case REVISIONS_FETCH_SUCCESS:
      return state.set(action.requestId, Map({
        loading: false,
        error: null,
      }));

    case REVISION_FETCH_FAILURE:
    case REVISIONS_FETCH_FAILURE:
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
