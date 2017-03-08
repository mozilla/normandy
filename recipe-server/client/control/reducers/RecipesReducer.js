import {
  RECIPE_ADDED,
  RECIPE_DELETED,
  RECIPE_UPDATED,
  RECIPES_RECEIVED,
  SET_SELECTED_RECIPE,
  SINGLE_RECIPE_RECEIVED,
  SINGLE_REVISION_RECEIVED,
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
  switch (action.type) {
    case RECIPES_RECEIVED: {
      let revisions = { ...state.revisions };

      action.recipes.forEach(recipe => {
        revisions = {
          ...revisions,
          [recipe.id]: {
            ...revisions[recipe.id],
            [recipe.revision_id]: { ...recipe },
          },
        };
      });

      return {
        ...state,
        list: [].concat(action.recipes),
        recipeListNeedsFetch: false,
        revisions,
      };
    }
    case SINGLE_RECIPE_RECEIVED: {
      return {
        ...state,
        list: dedupe([action.recipe].concat(state.list)),
        recipeListNeedsFetch: true,
        selectedRecipe: action.recipe.id,
        revisions: {
          ...state.revisions,
          [action.recipe.id]: {
            ...state.revisions[action.recipe.id],
            [action.recipe.revision_id]: {
              ...action.recipe,
            },
          },
        },
      };
    }

    case SINGLE_REVISION_RECEIVED: {
      return {
        ...state,
        revisions: {
          ...state.revisions,
          [action.revision.recipe.id]: {
            ...state.revisions[action.revision.recipe.id],
            [action.revision.id]: {
              ...action.revision.recipe,
            },
          },
        },
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
        revisions: {
          ...state.revisions,
          [action.recipe.id]: {
            ...state.revisions[action.recipe.id],
            [action.recipe.revision_id]: {
              ...action.recipe,
            },
          },
        },
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
        revisions: {
          ...state.revisions,
          [action.recipe.id]: {
            ...state.revisions[action.recipe.id],
            [action.recipe.revision_id]: {
              ...action.recipe,
            },
          },
        },
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
