import appReducer from 'control/reducers';
import * as actions from 'control/actions/RecipeActions';
import {
  fixtureRecipes,
  fixtureRecipeDict,
  fixtureStoredRevisions,
  fixtureSingleRevision,
  fixtureStoredSingleRevision,
  initialState,
} from 'control/tests/fixtures';

const fakeRecipe = fixtureRecipeDict[1];

describe('Notification reducer', () => {
  it('should return initial state by default', () => {
    expect(appReducer(undefined, {})).toEqual(initialState);
  });

  it('should handle RECIPES_RECEIVED', () => {
    expect(appReducer(undefined, {
      type: actions.RECIPES_RECEIVED,
      recipes: fixtureRecipes,
    })).toEqual({
      ...initialState,
      recipes: {
        ...initialState.recipes,
        revisions: fixtureStoredRevisions,
        entries: fixtureRecipeDict,
        selectedRecipe: null,
        recipeListNeedsFetch: false,
      },
    });
  });

  it('should handle SINGLE_RECIPE_RECEIVED', () => {
    expect(appReducer(undefined, {
      type: actions.SINGLE_RECIPE_RECEIVED,
      recipe: fixtureRecipes[0],
    })).toEqual({
      ...initialState,
      recipes: {
        ...initialState.recipes,
        entries: {
          [fixtureRecipes[0].id]: fixtureRecipes[0],
        },
        revisions: fixtureStoredSingleRevision,
        selectedRecipe: 1,
        recipeListNeedsFetch: true,
      },
    });
  });

  it('should handle SET_SELECTED_RECIPE', () => {
    expect(appReducer(undefined, {
      type: actions.SET_SELECTED_RECIPE,
      recipeId: 2,
    })).toEqual({
      ...initialState,
      recipes: {
        ...initialState.recipes,
        selectedRecipe: 2,
      },
    });
  });

  it('should handle SET_SELECTED_REVISION', () => {
    expect(appReducer(undefined, {
      type: actions.SET_SELECTED_REVISION,
      revisionId: 2,
    })).toEqual({
      ...initialState,
      recipes: {
        ...initialState.recipes,
        selectedRevision: 2,
      },
    });
  });

  it('should handle REVISIONS_RECEIVED', () => {
    expect(appReducer(undefined, {
      type: actions.REVISIONS_RECEIVED,
      revisions: [fixtureSingleRevision],
      recipeId: 'test-id',
    })).toEqual({
      ...initialState,
      recipes: {
        ...initialState.recipes,
        revisions: {
          'test-id': {
            [fixtureSingleRevision.id]: fixtureSingleRevision,
          },
        },
      },
    });
  });

  it('should handle RECIPE_ADDED', () => {
    expect(appReducer(initialState, {
      type: actions.RECIPE_ADDED,
      recipe: fakeRecipe,
    })).toEqual({
      ...initialState,
      recipes: {
        ...initialState.recipes,
        entries: {
          [fakeRecipe.id]: fakeRecipe,
        },
        revisions: fixtureStoredSingleRevision,
      },
    });
  });

  it('should handle RECIPE_UPDATED', () => {
    const updatedRecipe = {
      id: 3,
      name: 'Updated recipe name',
      enabled: true,
      revision_id: 'ghi',
    };

    expect(appReducer({
      ...initialState,
      recipes: {
        ...initialState.recipes,
        entries: fixtureRecipeDict,
        revisions: fixtureStoredRevisions,
      },
    }, {
      type: actions.RECIPE_UPDATED,
      recipe: updatedRecipe,
    })).toEqual({
      ...initialState,
      recipes: {
        ...initialState.recipes,
        entries: {
          ...fixtureRecipeDict,
          3: updatedRecipe,
        },
        revisions: {
          ...fixtureStoredRevisions,
          3: {
            ...fixtureStoredRevisions[3],
            ghi: updatedRecipe,
          },
        },
      },
    });
  });

  it('should handle RECIPE_DELETED', () => {
    const testId = 3;

    expect(appReducer({
      ...initialState,
      recipes: {
        ...initialState.recipes,
        entries: fixtureRecipeDict,
        revisions: fixtureStoredRevisions,
      },
    }, {
      type: actions.RECIPE_DELETED,
      recipeId: testId,
    })).toEqual({
      ...initialState,
      recipes: {
        ...initialState.recipes,
        revisions: fixtureStoredRevisions,
        entries: {
          1: fixtureRecipeDict[1],
          2: fixtureRecipeDict[2],
        },
      },
    });
  });

  describe('Recipe Creation and Loading', () => {
    it('should prevent duplicate recipes from loading into memory', () => {
      let store = appReducer(initialState, {
        type: actions.RECIPE_ADDED,
        recipe: fakeRecipe,
      });

      store = appReducer(store, {
        type: actions.RECIPES_RECEIVED,
        recipes: [fakeRecipe],
      });

      expect(Object.keys(store.recipes.entries).length).toBe(1);
    });
  });
});
