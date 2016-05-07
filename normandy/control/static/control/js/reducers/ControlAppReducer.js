import {
  REQUEST_IN_PROGRESS,
  REQUEST_COMPLETE,
  RECIPES_RECEIVED,
  SET_SELECTED_RECIPE
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
    case SET_SELECTED_RECIPE:
      return Object.assign({}, state, {
        selectedRecipe: action.recipeId
      });
    default:
      return state;
  }
}

export default controlAppReducer;
