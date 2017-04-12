import {
  RECIPE_ADDED,
  RECIPE_DELETED,
  RECIPE_UPDATED,
  RECIPES_RECEIVED,
  RECIPES_NEED_FETCH,
  REVISION_RECIPE_UPDATED,
  REVISIONS_RECEIVED,
  SET_SELECTED_RECIPE,
  SET_SELECTED_REVISION,
  SINGLE_RECIPE_RECEIVED,
  SINGLE_REVISION_RECEIVED,
} from 'control/actions/RecipeActions';

const initialState = {
  entries: {},
  revisions: {},
  cache: {},
  selectedRecipe: null,
  recipeListNeedsFetch: true,
};

function recipesReducer(state = initialState, action) {
  switch (action.type) {
    case RECIPES_RECEIVED: {
      // convert array of recipes into an obj
      // keyed on the recipe id
      const recipesObj = {};
      const revisionsObj = {};
      (action.recipes || []).forEach(recipe => {
        recipesObj[recipe.id] = { ...recipe };
        revisionsObj[recipe.id] = {
          ...revisionsObj[recipe.id],
          [recipe.revision_id]: {
            approval_request: recipe.approval_request,
            id: recipe.revision_id,
            recipe,
          },
        };
      });

      const cacheObj = {};
      if (action.cacheKey) {
        cacheObj[action.cacheKey] = [].concat(action.recipes);
      }

      return {
        ...state,
        entries: {
          ...state.entries,
          ...recipesObj,
        },
        revisions: {
          ...state.revisions,
          ...revisionsObj,
        },
        cache: {
          ...state.cache,
          ...cacheObj,
        },
        recipeListNeedsFetch: false,
      };
    }


    case SINGLE_RECIPE_RECEIVED: {
      return {
        ...state,
        selectedRecipe: action.recipe.id,
        entries: {
          ...state.entries,
          [action.recipe.id]: action.recipe,
        },
        revisions: {
          ...state.revisions,
          [action.recipe.id]: {
            ...state.revisions[action.recipe.id],
            [action.recipe.revision_id]: {
              approval_request: action.recipe.approval_request,
              id: action.recipe.revision_id,
              recipe: action.recipe,
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
              ...action.revision,
            },
          },
        },
      };
    }

    case REVISION_RECIPE_UPDATED: {
      return {
        ...state,
        revisions: {
          ...state.revisions,
          [action.recipe.id]: {
            ...state.revisions[action.recipe.id],
            [action.revisionId]: {
              ...state.revisions[action.recipe.id][action.revisionId],
              recipe: {
                ...action.recipe,
              },
            },
          },
        },
      };
    }

    case RECIPES_NEED_FETCH: {
      return {
        ...state,
        selectedRecipe: null,
        recipeListNeedsFetch: true,
      };
    }

    case REVISIONS_RECEIVED: {
      const newRevisions = {};
      [].concat(action.revisions).forEach(rev => {
        newRevisions[rev.id] = rev;
      });

      return {
        ...state,
        revisions: {
          ...state.revisions,
          [action.recipeId]: {
            ...state.revisions[action.recipeId],
            ...newRevisions,
          },
        },
      };
    }

    case SET_SELECTED_RECIPE:
      return {
        ...state,
        selectedRecipe: action.recipeId,
      };

    case SET_SELECTED_REVISION:
      return {
        ...state,
        selectedRevision: action.revisionId,
      };

    case RECIPE_ADDED:
      return {
        ...state,
        entries: {
          ...state.entries,
          [action.recipe.id]: { ...action.recipe },
        },
        revisions: {
          ...state.revisions,
          [action.recipe.id]: {
            ...state.revisions[action.recipe.id],
            [action.recipe.revision_id]: {
              approval_request: null,
              id: action.recipe.revision_id,
              recipe: action.recipe,
            },
          },
        },
      };

    case RECIPE_UPDATED: {
      const newEntries = { ...state.entries };
      newEntries[action.recipe.id] = { ...action.recipe };

      return {
        ...state,
        entries: newEntries,
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

    case RECIPE_DELETED: {
      const newEntries = { ...state.entries };
      delete newEntries[action.recipeId];

      return {
        ...state,
        entries: newEntries,
      };
    }

    default: {
      return state;
    }
  }
}

export default recipesReducer;
