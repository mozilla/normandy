import { combineReducers } from 'redux';

import {
  RECIPE_FETCH,
  RECIPE_FETCH_FAILURE,
  RECIPE_FETCH_SUCCESS,
  RECIPE_RECIEVE,
} from '../action-types';


function objects(state = {}, action) {
  switch (action.type) {
    case RECIPE_RECIEVE:
      return {
        ...state,
        [action.recipe.id]: action.recipe,
      };

    default:
      return state;
  }
}


function requests(state = {}, action) {
  switch (action.type) {
    case RECIPE_FETCH:
      return {
        ...state,
        [action.requestId]: {
          loading: true,
          error: null,
        },
      };

    case RECIPE_FETCH_SUCCESS:
      return {
        ...state,
        [action.requestId]: {
          loading: false,
          error: null,
        },
      };

    case RECIPE_FETCH_FAILURE:
      return {
        ...state,
        [action.requestId]: {
          loading: false,
          error: action.error,
        },
      };

    default:
      return state;
  }
}


export default combineReducers({
  objects,
  requests,
});
