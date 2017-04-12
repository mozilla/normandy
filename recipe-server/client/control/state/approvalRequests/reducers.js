import { fromJS, Map } from 'immutable';
import { combineReducers } from 'redux';

import {
  APPROVAL_REQUEST_FETCH,
  APPROVAL_REQUEST_FETCH_FAILURE,
  APPROVAL_REQUEST_FETCH_SUCCESS,
  APPROVAL_REQUEST_RECEIVE,
  APPROVAL_REQUESTS_FETCH,
  APPROVAL_REQUESTS_FETCH_FAILURE,
  APPROVAL_REQUESTS_FETCH_SUCCESS,
} from '../action-types';


function objects(state = Map({}), action) {
  switch (action.type) {
    case APPROVAL_REQUEST_RECEIVE:
      return state.set(action.approvalRequest.id, fromJS(action.approvalRequest));

    default:
      return state;
  }
}


function requests(state = Map({}), action) {
  switch (action.type) {
    case APPROVAL_REQUEST_FETCH:
    case APPROVAL_REQUESTS_FETCH:
      return state.set(action.requestId, Map({
        loading: true,
        error: null,
      }));

    case APPROVAL_REQUEST_FETCH_SUCCESS:
    case APPROVAL_REQUESTS_FETCH_SUCCESS:
      return state.set(action.requestId, Map({
        loading: false,
        error: null,
      }));

    case APPROVAL_REQUEST_FETCH_FAILURE:
    case APPROVAL_REQUESTS_FETCH_FAILURE:
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
