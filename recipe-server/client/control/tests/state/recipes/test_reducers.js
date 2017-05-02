import { fromJS, List } from 'immutable';

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
  it('should return initial state by default', () => {
    expect(recipesReducer(undefined, {})).toEqual(INITIAL_STATE);
  });

  it('should handle RECIPE_RECEIVE', () => {
    expect(recipesReducer(undefined, {
      type: RECIPE_RECEIVE,
      recipe: RECIPE,
    })).toEqual({
      ...INITIAL_STATE,
      items: INITIAL_STATE.items.set(RECIPE.id, fromJS(RECIPE)),
    });
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
