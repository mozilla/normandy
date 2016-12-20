import {
  RECIPES_RECEIVED, SINGLE_RECIPE_RECEIVED, RECIPE_ADDED,
  RECIPE_UPDATED, RECIPE_DELETED, SET_SELECTED_RECIPE, RECIPES_NEED_FETCH,
} from 'control/actions/ControlActions';

import cloneArray from 'client/utils/clone-array-values';

const initialState = {
  list: [],
  selectedRecipe: null,
  recipeListNeedsFetch: true,
};

function recipesReducer(state = initialState, action) {
  switch (action.type) {
    case RECIPES_RECEIVED:
      return {
        ...state,
        list: cloneArray(state.list).concat(action.recipes),
        recipeListNeedsFetch: false,
      };

    case SINGLE_RECIPE_RECEIVED:
      return {
        ...state,
        list: cloneArray(state.list).concat([action.recipe]),
        recipeListNeedsFetch: true,
        selectedRecipe: action.recipe.id,
      };

    case RECIPES_NEED_FETCH:
      return {
        ...state,
        list: [],
        selectedRecipe: null,
        recipeListNeedsFetch: true,
      };

    case SET_SELECTED_RECIPE:
      return {
        ...state,
        selectedRecipe: action.recipeId,
      };

    case RECIPE_ADDED:
      return {
        ...state,
        list: cloneArray(state.list).concat([
          ...state.list || [],
          action.recipe,
        ]),
      };
    case RECIPE_UPDATED:
      return {
        ...state,
        list: cloneArray(state.list).map(recipe => {
          if (recipe.id === action.recipe.id) {
            return { ...recipe, ...action.recipe };
          }
          return recipe;
        }),
      };
    case RECIPE_DELETED:
      return {
        ...state,
        list: cloneArray(state.list).filter(recipe => recipe.id !== action.recipeId),
      };

    default:
      return state;
  }
}

export default recipesReducer;
