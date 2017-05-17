import { fromJS, List } from 'immutable';
import * as matchers from 'jasmine-immutable-matchers';

import {
  RECIPE_RECEIVE,
  RECIPE_FILTERS_RECEIVE,
  RECIPE_HISTORY_RECEIVE,
} from 'control/state/action-types';
import recipesReducer from 'control/state/recipes/reducers';

import {
  FILTERS,
  INITIAL_STATE,
  RECIPE,
} from '.';

import {
  REVISION,
} from '../revisions';


describe('Recipes reducer', () => {
  beforeEach(() => {
    jasmine.addMatchers(matchers);
  });

  it('should return initial state by default', () => {
    expect(recipesReducer(undefined, {})).toEqual(INITIAL_STATE);
  });

  it('should handle RECIPE_RECEIVE', () => {
    const reducedRecipe = {
      ...RECIPE,
      action_id: RECIPE.action.id,
      latest_revision_id: RECIPE.latest_revision.id,
      approved_revision_id: null,
    };

    delete reducedRecipe.action;
    delete reducedRecipe.latest_revision;
    delete reducedRecipe.approved_revision;

    const updatedState = recipesReducer(undefined, {
      type: RECIPE_RECEIVE,
      recipe: RECIPE,
    });

    expect(updatedState.items).toEqualImmutable(
      INITIAL_STATE.items.set(RECIPE.id, fromJS(reducedRecipe))
    );
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
      recipeId: RECIPE.id,
      revisions: [REVISION],
    })).toEqual({
      ...INITIAL_STATE,
      history: INITIAL_STATE.history.set(RECIPE.id, new List([REVISION.id])),
    });
  });
});
