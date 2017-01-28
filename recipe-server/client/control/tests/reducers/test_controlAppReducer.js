import appReducer from 'control/reducers';
import * as actions from 'control/actions/ControlActions';
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

describe('controlApp reducer', () => {
  it('should return initial state by default', () => {
    expect(appReducer(undefined, {})).toEqual(initialState);
  });

  it('should handle REQUEST_IN_PROGRESS', () => {
    expect(appReducer(undefined, {
      type: actions.REQUEST_IN_PROGRESS,
    })).toEqual({
      ...initialState,
      controlApp: {
        isFetching: true,
      },
    });
  });

  it('should handle REQUEST_COMPLETE', () => {
    expect(appReducer(undefined, {
      type: actions.REQUEST_COMPLETE,
    })).toEqual({
      ...initialState,
      controlApp: {
        isFetching: false,
      },
    });
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

  it(`
    should append notifications to the notification list for the
    SHOW_NOTIFICATION action
  `, () => {
    const notification = {
      messageType: 'success',
      message: 'Success message',
      id: 5,
    };

    expect(appReducer(undefined, {
      type: actions.SHOW_NOTIFICATION,
      notification,
    })).toEqual({
      ...initialState,
      notifications: [notification],
    });
  });

  describe('DISMISS_NOTIFICATION', () => {
    const notification1 = {
      messageType: 'success',
      message: 'message1',
      id: 1,
    };
    const notification2 = {
      messageType: 'success',
      message: 'message2',
      id: 2,
    };
    const startState = {
      ...initialState,
      notifications: [notification1, notification2],
    };

    it('should remove matching notifications from the notification list', () => {
      expect(
        appReducer(startState, {
          type: actions.DISMISS_NOTIFICATION,
          notificationId: notification1.id,
        })
      ).toEqual({
        ...initialState,
        notifications: [notification2],
      });
    });

    it('should not remove any notifications when an invalid id is given', () => {
      expect(
        appReducer(startState, {
          type: actions.DISMISS_NOTIFICATION,
          id: 99999,
        })
      ).toEqual({
        ...initialState,
        notifications: [notification1, notification2],
      });
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
