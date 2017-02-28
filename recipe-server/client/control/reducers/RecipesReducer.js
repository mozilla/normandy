import {
  RECIPES_RECEIVED, SINGLE_RECIPE_RECEIVED, RECIPE_ADDED,
  RECIPE_UPDATED, RECIPE_DELETED, SET_SELECTED_RECIPE,
} from 'control/actions/ControlActions';

const initialState = {
  list: [],
  selectedRecipe: null,
  recipeListNeedsFetch: true,
};

// This is unnecessary once landed in master
const dedupe = arr => {
  const seen = {};
  return arr.filter(({ id }) => {
    const hasSeen = seen[id];
    seen[id] = true;
    return !hasSeen;
  });
};

function recipesReducer(state = initialState, action) {
  switch (action.type) {
    case RECIPES_RECEIVED:
      return {
        ...state,
        list: dedupe(action.recipes.concat(state.list)),
        recipeListNeedsFetch: false,
      };
    case SINGLE_RECIPE_RECEIVED:
      return {
        ...state,
        list: dedupe([action.recipe].concat(state.list)),
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
        list: dedupe([action.recipe].concat(state.list)),
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
