import {
  REQUEST_IN_PROGRESS,
  REQUEST_COMPLETE,
  RECIPES_RECEIVED
} from '../actions/ControlActions.js';

let initialState = {
  recipes: null,
  isFetching: false,
  selectedRecipe: null,
  recipeListNeedsFetch: true
};

export function controlAppReducer(state = initialState, action) {
  switch (action.type) {
    case REQUEST_IN_PROGRESS:
      return Object.assign({}, state, {
        isFetching: true
      });
    case REQUEST_COMPLETE:
      return Object.assign({}, state, {
        isFetching: false
      });
    case RECIPES_RECEIVED:
      return Object.assign({}, state, {
        recipes: action.recipes,
        recipeListNeedsFetch: false
      });
    default:
      return state;
  }
}

export default controlAppReducer;
