import {
  RECIPES_RECEIVED, SINGLE_RECIPE_RECEIVED, RECIPE_ADDED,
  RECIPE_UPDATED, RECIPE_DELETED, SET_SELECTED_RECIPE,
} from 'control/actions/ControlActions';

const initialState = {
  list: {},
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
        list: {
          ...state.list,
          ...recipesObj,
        },
        recipeListNeedsFetch: false,
      };
    }

    case SINGLE_RECIPE_RECEIVED: {
      return {
        ...state,
        list: {
          ...state.list,
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
        list: {
          ...state.list,
          [action.recipe.id]: action.recipe,
        },
      };
    }

    case RECIPE_UPDATED: {
      const newList = { ...state.list };
      newList[action.recipe.id] = { ...action.recipe };

      return {
        ...state,
        list: newList,
      };
    }

    case RECIPE_DELETED: {
      const newList = { ...state.list };
      delete newList[action.recipeId];

      return {
        ...state,
        list: newList,
      };
    }

    default:
      return state;
  }
}

export default recipesReducer;
