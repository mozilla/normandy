import {
  RECIPES_RECEIVED, SINGLE_RECIPE_RECEIVED,
  SINGLE_REVISION_RECEIVED, RECIPE_ADDED, RECIPE_UPDATED, RECIPE_DELETED,
  SET_SELECTED_RECIPE,
} from 'control/actions/ControlActions';

const initialState = {
  list: [],
  revisions: {},
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
  let newRevisions = {};

  switch (action.type) {
    case RECIPES_RECEIVED: {
      [].concat(action.recipes).forEach(recipe => {
        newRevisions[recipe.id] = {};
        newRevisions[recipe.id][recipe.revision_id] = { ...recipe };
      });
      return {
        ...state,
        list: [].concat(action.recipes),
        revisions: newRevisions,
        recipeListNeedsFetch: false,
      };
    }
    case SINGLE_RECIPE_RECEIVED: {
      newRevisions = { ...state.revisions };
      newRevisions[action.recipe.id] = newRevisions[action.recipe.id] || {};
      newRevisions[action.recipe.id][action.recipe.revision_id] = { ...action.recipe };

      return {
        ...state,
        list: dedupe([action.recipe].concat(state.list)),
        revisions: newRevisions,
        recipeListNeedsFetch: true,
        selectedRecipe: action.recipe.id,
      };
    }

    case SINGLE_REVISION_RECEIVED: {
      newRevisions = { ...state.revisions };
      newRevisions[action.recipeId] = newRevisions[action.recipeId] || {};
      newRevisions[action.recipeId][action.revision.id] = { ...action.revision.recipe };

      return {
        ...state,
        revisions: newRevisions,
      };
    }

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
