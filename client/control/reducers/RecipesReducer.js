import {
  RECIPES_RECEIVED,
  SINGLE_RECIPE_RECEIVED,
  RECIPE_ADDED,
  RECIPE_UPDATED,
  RECIPE_DELETED,
  SET_SELECTED_RECIPE,
  RECIPES_NEED_FETCH,
} from 'control/actions/ControlActions';

import cloneArrayValues from 'client/utils/clone-array';

const initialState = {
  list: [],
  cache: {},
  selectedRecipe: null,
  recipeListNeedsFetch: true,
};

function recipesReducer(state = initialState, action) {
  let newState;

  switch (action.type) {
    case RECIPES_RECEIVED:
      newState = {
        ...state,
        list: cloneArrayValues(state.list).concat(action.recipes),
        recipeListNeedsFetch: false,
      };

      // if we're given a 'key'
      // (aka a filter param string)
      // we can key our cache on it
      if (action.key) {
        newState = {
          ...newState,
          cache: {
            ...newState.cache,
            // update the 'cache' object entry for this
            // particular cache key
            [action.key]: action.recipes,
          },
        };
      }
      break;

    case SINGLE_RECIPE_RECEIVED:
      newState = {
        ...state,
        list: cloneArrayValues(state.list).concat([action.recipe]),
        recipeListNeedsFetch: true,
        selectedRecipe: action.recipe.id,
      };

      break;

    case RECIPES_NEED_FETCH:
      newState = {
        ...state,
        list: [],
        selectedRecipe: null,
        recipeListNeedsFetch: true,
      };

      break;

    case SET_SELECTED_RECIPE:
      newState = {
        ...state,
        selectedRecipe: action.recipeId,
      };

      break;

    case RECIPE_ADDED:
      newState = {
        ...state,
        list: cloneArrayValues(state.list).concat([
          ...state.list || [],
          action.recipe,
        ]),
      };
      break;

    case RECIPE_UPDATED:
      newState = {
        ...state,
        list: cloneArrayValues(state.list).map(recipe => {
          if (recipe.id === action.recipe.id) {
            return { ...recipe,
              ...action.recipe,
            };
          }
          return recipe;
        }),
      };
      break;

    case RECIPE_DELETED:
      newState = {
        ...state,
        list: cloneArrayValues(state.list).filter(recipe => recipe.id !== action.recipeId),
      };
      break;

    default:
      break;
  }

  return newState || state;
}

export default recipesReducer;
