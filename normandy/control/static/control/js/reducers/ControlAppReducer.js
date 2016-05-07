import {
  REQUEST_IN_PROGRESS, REQUEST_COMPLETE,
  RECIPES_RECEIVED, SINGLE_RECIPE_RECEIVED,
  RECIPE_ADDED, RECIPE_UPDATED,
  SET_SELECTED_RECIPE } from '../actions/ControlActions.js';

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
    case SINGLE_RECIPE_RECEIVED:
      return Object.assign({}, state, {
        recipes: [action.recipe],
        recipeListNeedsFetch: true,
        selectedRecipe: action.recipe.id
      });

    case SET_SELECTED_RECIPE:
      return Object.assign({}, state, {
        selectedRecipe: action.recipeId
      });

    case RECIPE_ADDED:
      return Object.assign({}, state, {
        recipes: [
          ...state.recipes || [],
          action.recipe
        ]
      });
    case RECIPE_UPDATED:
      return Object.assign({}, state, {
        recipes: state.recipes.map((recipe) => {
          if (recipe.id === action.recipe.id) {
            recipe = Object.assign(recipe, action.recipe);
          }
          return recipe;
        })
      });

    default:
      return state;
  }
}

export default controlAppReducer;
