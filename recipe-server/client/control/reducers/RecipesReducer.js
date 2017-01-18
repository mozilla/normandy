import {
  RECIPES_RECEIVED, SINGLE_RECIPE_RECEIVED, RECIPE_ADDED,
  RECIPE_UPDATED, RECIPE_DELETED, SET_SELECTED_RECIPE,
} from 'control/actions/ControlActions';

import mergeByKey from 'client/utils/merge-arrays';
// create a merging func that combines two arrays of objs
// based on the 'id' prop of those objects
// (in this case, our recipes)
const mergeRecipeArrays = mergeByKey('id');

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
        list: mergeRecipeArrays(state.list, action.recipes),
        recipeListNeedsFetch: false,
      };

    case SINGLE_RECIPE_RECEIVED:
      return {
        ...state,
        list: mergeRecipeArrays(state.list, [action.recipe]),
        recipeListNeedsFetch: true,
        selectedRecipe: action.recipe.id,
      };

    case SET_SELECTED_RECIPE:
      return {
        ...state,
        selectedRecipe: action.recipeId,
      };

    case RECIPE_ADDED:
      return {
        ...state,
        list: mergeRecipeArrays(state.list, ...state.list || [], [action.recipe]),
      };

    case RECIPE_UPDATED:
      return {
        ...state,
        list: mergeRecipeArrays(state.list)
          .map(recipe => {
            if (recipe.id === action.recipe.id) {
              return { ...recipe, ...action.recipe };
            }
            return recipe;
          }),
      };

    case RECIPE_DELETED:
      return {
        ...state,
        list: mergeRecipeArrays(state.list)
          .filter(recipe => recipe.id !== action.recipeId),
      };

    default:
      return state;
  }
}

export default recipesReducer;
