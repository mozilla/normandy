import { fromJS } from 'immutable';
import * as matchers from 'jasmine-immutable-matchers';

import {
  getRecipe,
  getRecipeFilters,
  getRecipeHistory,
} from 'control/state/recipes/selectors';

import {
  FILTERS,
  RECIPE,
} from '.';

import {
  INITIAL_STATE,
} from '..';

import {
  REVISION,
} from '../revisions';


describe('getRecipe', () => {
  const STATE = {
    ...INITIAL_STATE,
    newState: {
      ...INITIAL_STATE.newState,
      recipes: {
        ...INITIAL_STATE.newState.recipes,
        items: INITIAL_STATE.newState.recipes.items.set(RECIPE.id, fromJS(RECIPE)),
      },
    },
  };

  it('should return the recipe', () => {
    expect(getRecipe(STATE, RECIPE.id)).toEqual(fromJS(RECIPE));
  });

  it('should return `undefined` for invalid ID', () => {
    expect(getRecipe(STATE, 'invalid')).toEqual(undefined);
  });

  it('should return default value for invalid ID with default provided', () => {
    expect(getRecipe(STATE, 'invalid', 'default')).toEqual('default');
  });
});


describe('getRecipeFilters', () => {
  const STATE = {
    ...INITIAL_STATE,
    newState: {
      ...INITIAL_STATE.newState,
      recipes: {
        ...INITIAL_STATE.newState.recipes,
        filters: fromJS(FILTERS),
      },
    },
  };

  beforeEach(() => {
    jasmine.addMatchers(matchers);
  });

  it('should return the list of filters', () => {
    expect(getRecipeFilters(STATE)).toEqualImmutable(fromJS(FILTERS));
  });
});


describe('getRecipeHistory', () => {
  const STATE = {
    ...INITIAL_STATE,
    newState: {
      ...INITIAL_STATE.newState,
      revisions: {
        ...INITIAL_STATE.newState.revisions,
        items: INITIAL_STATE.newState.revisions.items.set(REVISION.id, fromJS(REVISION)),
      },
      recipes: {
        ...INITIAL_STATE.newState.recipes,
        history: INITIAL_STATE.newState.recipes.history.set(
          REVISION.recipe.id,
          fromJS([REVISION.id])
        ),
      },
    },
  };

  beforeEach(() => {
    jasmine.addMatchers(matchers);
  });

  it('should return the list of revisions', () => {
    expect(getRecipeHistory(STATE, REVISION.recipe.id)).toEqualImmutable(fromJS([REVISION]));
  });
});
