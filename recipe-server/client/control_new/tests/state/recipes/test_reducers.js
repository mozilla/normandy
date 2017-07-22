import { fromJS, List } from 'immutable';
import * as matchers from 'jasmine-immutable-matchers';

import {
  RECIPE_DELETE,
  RECIPE_RECEIVE,
  RECIPE_FILTERS_RECEIVE,
  RECIPE_HISTORY_RECEIVE,
} from 'control_new/state/action-types';
import recipesReducer from 'control_new/state/app/recipes/reducers';
import {
  FILTERS,
  INITIAL_STATE,
  RecipeFactory,
} from 'control_new/tests/state/recipes';


describe('Recipes reducer', () => {
  const recipe = RecipeFactory.build();

  beforeEach(() => {
    jasmine.addMatchers(matchers);
  });

  it('should return initial state by default', () => {
    expect(recipesReducer(undefined, {})).toEqual(INITIAL_STATE);
  });

  it('should handle RECIPE_RECEIVE', () => {
    const reducedRecipe = {
      ...recipe,
      action_id: recipe.action.id,
      latest_revision_id: recipe.latest_revision.id,
      approved_revision_id: recipe.approved_revision ? recipe.approved_revision.id : null,
    };

    delete reducedRecipe.action;
    delete reducedRecipe.latest_revision;
    delete reducedRecipe.approved_revision;

    const updatedState = recipesReducer(undefined, {
      type: RECIPE_RECEIVE,
      recipe,
    });

    expect(updatedState.items).toEqualImmutable(
      INITIAL_STATE.items.set(recipe.id, fromJS(reducedRecipe)),
    );
  });

  it('should handle RECIPE_DELETE', () => {
    const state = recipesReducer(undefined, {
      type: RECIPE_RECEIVE,
      recipe,
    });

    const updateState = recipesReducer(state, {
      type: RECIPE_DELETE,
      recipeId: recipe.id,
    });

    expect(updateState).toEqual(INITIAL_STATE);
  });

  it('should handle RECIPE_FILTERS_RECEIVE', () => {
    expect(recipesReducer(undefined, {
      type: RECIPE_FILTERS_RECEIVE,
      filters: FILTERS,
    })).toEqual({
      ...INITIAL_STATE,
      filters: INITIAL_STATE.filters.merge(fromJS(FILTERS)),
    });
  });

  it('should handle RECIPE_HISTORY_RECEIVE', () => {
    expect(recipesReducer(undefined, {
      type: RECIPE_HISTORY_RECEIVE,
      recipeId: recipe.id,
      revisions: [recipe.latest_revision],
    })).toEqual({
      ...INITIAL_STATE,
      history: INITIAL_STATE.history.set(recipe.id, new List([recipe.latest_revision.id])),
    });
  });
});
