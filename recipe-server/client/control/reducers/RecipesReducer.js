import {
  RECIPES_RECEIVED,
  SINGLE_RECIPE_RECEIVED,
  RECIPE_ADDED,
  RECIPE_UPDATED,
  RECIPE_DELETED,
  SET_SELECTED_RECIPE,
  RECIPES_NEED_FETCH,
} from 'control/actions/ControlActions';

const initialState = {
  entries: {},
  cache: {},
  selectedRecipe: null,
  recipeListNeedsFetch: true,
};

function recipesReducer(state = initialState, action) {
  let newState;

  switch (action.type) {
    case RECIPES_RECEIVED: {
      // convert array of recipes into an obj
      // keyed on the recipe id
      const recipesObj = {};
      (action.recipes || []).forEach(recipe => {
        recipesObj[recipe.id] = { ...recipe };
      });

      newState = {
        ...state,
        entries: {
          ...state.entries,
          ...recipesObj,
        },
        recipeListNeedsFetch: false,
      };

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
    }

    case SINGLE_RECIPE_RECEIVED: {
      newState = {
        ...state,
        entries: {
          ...state.entries,
          [action.recipe.id]: action.recipe,
        },
        recipeListNeedsFetch: true,
        selectedRecipe: action.recipe.id,
      };
      break;
    }

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
        entries: {
          ...state.entries,
          [action.recipe.id]: { ...action.recipe },
        },
      };
      break;

    case RECIPE_UPDATED: {
      const newEntries = { ...state.entries };
      newEntries[action.recipe.id] = { ...action.recipe };

      newState =  {
        ...state,
        entries: newEntries,
      };
      break;
    }

    case RECIPE_DELETED: {
      const newEntries = { ...state.entries };
      delete newEntries[action.recipeId];

      newState = {
        ...state,
        entries: newEntries,
      };

      break;
    }

    default:
      break;
  }

  return newState || state;
}

export default recipesReducer;
