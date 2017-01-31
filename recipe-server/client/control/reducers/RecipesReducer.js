import {
  RECIPES_RECEIVED, SINGLE_RECIPE_RECEIVED, RECIPE_ADDED,
  RECIPE_UPDATED, RECIPE_DELETED, SET_SELECTED_RECIPE,
} from 'control/actions/ControlActions';

const initialState = {
  entries: {},
  selectedRecipe: null,
  recipeListNeedsFetch: true,
};

function recipesReducer(state = initialState, action) {
  switch (action.type) {
    case RECIPES_RECEIVED: {
      // convert array of recipes into an obj
      // keyed on the recipe id
      const recipesObj = {};
      (action.recipes || []).forEach(recipe => {
        recipesObj[recipe.id] = { ...recipe };
      });

      return {
        ...state,
        entries: {
          ...state.entries,
          ...recipesObj,
        },
        recipeListNeedsFetch: false,
      };
    }

    case SINGLE_RECIPE_RECEIVED: {
      return {
        ...state,
        entries: {
          ...state.entries,
          [action.recipe.id]: action.recipe,
        },
        recipeListNeedsFetch: true,
        selectedRecipe: action.recipe.id,
      };
    }

    case SET_SELECTED_RECIPE: {
      return {
        ...state,
        selectedRecipe: action.recipeId,
      };
    }

    case RECIPE_ADDED: {
      return {
        ...state,
        entries: {
          ...state.entries,
          [action.recipe.id]: action.recipe,
        },
      };
    }

    case RECIPE_UPDATED: {
      const newEntries = { ...state.entries };
      newEntries[action.recipe.id] = { ...action.recipe };

      return {
        ...state,
        entries: newEntries,
      };
    }

    case RECIPE_DELETED: {
      const newEntries = { ...state.entries };
      delete newEntries[action.recipeId];

      return {
        ...state,
        entries: newEntries,
      };
    }

    default:
      return state;
  }
}

export default recipesReducer;
