import { fromJS, Map } from 'immutable';
import { combineReducers } from 'redux';

import {
  RECIPE_FETCH,
  RECIPE_FETCH_FAILURE,
  RECIPE_FETCH_SUCCESS,
  RECIPE_RECIEVE,
} from '../action-types';


function objects(state = Map({}), action) {
  switch (action.type) {
    case RECIPE_RECIEVE:
      return state.update(action.recipe.id, fromJS(action.recipe));

    default:
      return state;
  }
}


function requests(state = Map({}), action) {
  switch (action.type) {
    case RECIPE_FETCH:
      return state.set(action.requestId, Map({
        loading: true,
        error: null,
      }));

    case RECIPE_FETCH_SUCCESS:
      return state.set(action.requestId, Map({
        loading: false,
        error: null,
      }));

    case RECIPE_FETCH_FAILURE:
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
