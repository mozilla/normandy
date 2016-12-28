import appReducer from 'control/reducers';
import * as actions from 'control/actions/RecipeActions';

import {
  fixtureRecipes,
  initialState,
} from 'control/tests/fixtures';

describe('Recipes reducer', () => {
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
        list: fixtureRecipes,
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
        list: [fixtureRecipes[0]],
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
        list: [],
        selectedRecipe: 2,
        recipeListNeedsFetch: true,
      },
    });
  });

  it('should handle RECIPE_ADDED', () => {
    expect(appReducer(initialState, {
      type: actions.RECIPE_ADDED,
      recipe: {
        id: 4,
        name: 'Villis stebulum',
        enabled: false,
      },
    })).toEqual({
      ...initialState,
      recipes: {
        ...initialState.recipes,
        list: [{
          id: 4,
          name: 'Villis stebulum',
          enabled: false,
        }],
        selectedRecipe: null,
        recipeListNeedsFetch: true,
      },
    });
  });

  it('should handle RECIPE_UPDATED', () => {
    expect(appReducer({
      ...initialState,
      recipes: {
        ...initialState.recipes,
        list: fixtureRecipes,
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
        list: [{
          id: 1,
          name: 'Lorem Ipsum',
          enabled: true,
        }, {
          id: 2,
          name: 'Dolor set amet',
          enabled: true,
        }, {
          id: 3,
          name: 'Updated recipe name',
          enabled: true,
        }],
        selectedRecipe: null,
        recipeListNeedsFetch: true,
      },
    });
  });

  it('should handle RECIPE_DELETED', () => {
    expect(appReducer({
      ...initialState,
      recipes: {
        ...initialState.recipes,
        list: fixtureRecipes,
      },
    }, {
      type: actions.RECIPE_DELETED,
      recipeId: 3,
    })).toEqual({
      ...initialState,
      recipes: {
        ...initialState.recipes,
        list: [{
          id: 1,
          name: 'Lorem Ipsum',
          enabled: true,
        }, {
          id: 2,
          name: 'Dolor set amet',
          enabled: true,
        }],
        selectedRecipe: null,
        recipeListNeedsFetch: true,
      },
    });
  });
});
