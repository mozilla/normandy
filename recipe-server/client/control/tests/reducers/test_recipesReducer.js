import appReducer from 'control/reducers';
import * as actions from 'control/actions/RecipeActions';
import {
  fixtureRecipes,
  fixtureRecipeDict,
  initialState,
} from 'control/tests/fixtures';

const fakeRecipe = {
  id: 4,
  name: 'Villis stebulum',
  enabled: false,
};

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
      },
    });
  });

  it('should handle RECIPE_UPDATED', () => {
    expect(appReducer({
      ...initialState,
      recipes: {
        ...initialState.recipes,
        entries: fixtureRecipeDict,
      },
    }, {
      type: actions.RECIPE_UPDATED,
      recipe: {
        id: 3,
        name: 'Updated recipe name',
        enabled: true,
      },
    })).toEqual({
      ...initialState,
      recipes: {
        ...initialState.recipes,
        entries: {
          1: {
            id: 1,
            name: 'Lorem Ipsum',
            enabled: true,
          },
          2: {
            id: 2,
            name: 'Dolor set amet',
            enabled: true,
          },
          3: {
            id: 3,
            name: 'Updated recipe name',
            enabled: true,
          },
        },
      },
    });
  });

  it('should handle RECIPE_DELETED', () => {
    expect(appReducer({
      ...initialState,
      recipes: {
        ...initialState.recipes,
        entries: fixtureRecipeDict,
      },
    }, {
      type: actions.RECIPE_DELETED,
      recipeId: 3,
    })).toEqual({
      ...initialState,
      recipes: {
        ...initialState.recipes,
        entries: {
          1: {
            id: 1,
            name: 'Lorem Ipsum',
            enabled: true,
          },
          2: {
            id: 2,
            name: 'Dolor set amet',
            enabled: true,
          },
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
