import {
  REQUEST_IN_PROGRESS, REQUEST_COMPLETE, RECIPES_RECEIVED,
  SINGLE_RECIPE_RECEIVED, RECIPE_ADDED, RECIPE_UPDATED, RECIPE_DELETED,
  SET_SELECTED_RECIPE, SHOW_NOTIFICATION, DISMISS_NOTIFICATION,
} from '../actions/ControlActions.js';

const initialState = {
  recipes: null,
  isFetching: false,
  selectedRecipe: null,
  recipeListNeedsFetch: true,
  notifications: [],
};

function controlAppReducer(state = initialState, action) {
  switch (action.type) {

    case REQUEST_IN_PROGRESS:
      return {
        ...state,
        isFetching: true,
      };
    case REQUEST_COMPLETE:
      return {
        ...state,
        isFetching: false,
      };

    case RECIPES_RECEIVED:
      return {
        ...state,
        recipes: action.recipes,
        recipeListNeedsFetch: false,
      };
    case SINGLE_RECIPE_RECEIVED:
      return {
        ...state,
        recipes: [action.recipe],
        recipeListNeedsFetch: true,
        selectedRecipe: action.recipe.id,
      };

    case SET_SELECTED_RECIPE:
      return {
        ...state,
        selectedRecipe: action.recipeId,
      };

    case SHOW_NOTIFICATION:
      return {
        ...state,
        notifications: [action.notification, ...state.notifications],
      };

    case DISMISS_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.notificationId),
      };

    case RECIPE_ADDED:
      return {
        ...state,
        recipes: [
          ...state.recipes || [],
          action.recipe,
        ],
      };
    case RECIPE_UPDATED:
      return {
        ...state,
        recipes: state.recipes.map(recipe => {
          if (recipe.id === action.recipe.id) {
            return Object.assign(recipe, action.recipe);
          }
          return recipe;
        }),
      };
    case RECIPE_DELETED:
      return {
        ...state,
        recipes: state.recipes.filter(recipe => recipe.id !== action.recipeId),
      };

    default:
      return state;
  }
}

export default controlAppReducer;
