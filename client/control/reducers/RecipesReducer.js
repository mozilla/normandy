import {
  RECIPES_RECEIVED, SINGLE_RECIPE_RECEIVED, RECIPE_ADDED,
  RECIPE_UPDATED, RECIPE_DELETED, SET_SELECTED_RECIPE,
} from 'control/actions/ControlActions';

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
        list: [].concat(state.list).concat(action.recipes),
        recipeListNeedsFetch: false,
      };
    case SINGLE_RECIPE_RECEIVED:
      return {
        ...state,
        list: [].concat(state.list).concat([action.recipe]),
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
        list: [].concat(state.list).concat([
          ...state.list || [],
          action.recipe,
        ]),
      };
    case RECIPE_UPDATED:
      return {
        ...state,
        list: [].concat(state.list).map(recipe => {
          if (recipe.id === action.recipe.id) {
            return { ...recipe, ...action.recipe };
          }
          return recipe;
        }),
      };
    case RECIPE_DELETED:
      return {
        ...state,
        list: [].concat(state.list).filter(recipe => recipe.id !== action.recipeId),
      };

    default:
      return state;
  }
}

export default recipesReducer;
