import { fromJS, Map } from 'immutable';
import { combineReducers } from 'redux';

import {
  RECIPE_FETCH,
  RECIPE_FETCH_FAILURE,
  RECIPE_FETCH_SUCCESS,
  RECIPE_RECEIVE,
  RECIPE_HISTORY_FETCH,
  RECIPE_HISTORY_FETCH_FAILURE,
  RECIPE_HISTORY_FETCH_SUCCESS,
  RECIPE_HISTORY_RECEIVE,
  RECIPES_FETCH,
  RECIPES_FETCH_FAILURE,
  RECIPES_FETCH_SUCCESS,
} from '../action-types';


function history(state = Map({}), action) {
  switch (action.type) {
    case RECIPE_HISTORY_RECEIVE:
      return state.set(action.recipeId, fromJS(action.revisions.map(revision => revision.id)));

    default:
      return state;
  }
}


function objects(state = Map({}), action) {
  switch (action.type) {
    case RECIPE_RECEIVE:
      return state.set(action.recipe.id, fromJS(action.recipe));

    default:
      return state;
  }
}


function requests(state = Map({}), action) {
  switch (action.type) {
    case RECIPE_FETCH:
    case RECIPE_HISTORY_FETCH:
    case RECIPES_FETCH:
      return state.set(action.requestId, Map({
        loading: true,
        error: null,
      }));

    case RECIPE_FETCH_SUCCESS:
    case RECIPE_HISTORY_FETCH_SUCCESS:
    case RECIPES_FETCH_SUCCESS:
      return state.set(action.requestId, Map({
        loading: false,
        error: null,
      }));

    case RECIPE_FETCH_FAILURE:
    case RECIPE_HISTORY_FETCH_FAILURE:
    case RECIPES_FETCH_FAILURE:
      return state.set(action.requestId, Map({
        loading: false,
        error: action.error,
      }));

    default:
      return state;
  }
}


export default combineReducers({
  history,
  objects,
  requests,
});
