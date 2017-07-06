import { fromJS } from 'immutable';
import * as matchers from 'jasmine-immutable-matchers';

import {
  ACTION_RECEIVE,
  RECIPE_RECEIVE,
  REVISION_RECEIVE,
} from 'control/state/action-types';
import actionsReducer from 'control/state/actions/reducers';
import recipesReducer from 'control/state/recipes/reducers';
import revisionsReducer from 'control/state/revisions/reducers';
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
      actions: actionsReducer(undefined, {
        type: ACTION_RECEIVE,
        action: RECIPE.action,
      }),
      recipes: recipesReducer(undefined, {
        type: RECIPE_RECEIVE,
        recipe: RECIPE,
      }),
      revisions: revisionsReducer(undefined, {
        type: REVISION_RECEIVE,
        revision: RECIPE.latest_revision,
      }),
    },
  };

  beforeEach(() => {
    jasmine.addMatchers(matchers);
  });

  it('should return the recipe', () => {
    expect(getRecipe(STATE, RECIPE.id)).toEqualImmutable(fromJS(RECIPE));
  });

  it('should return `null` for invalid ID', () => {
    expect(getRecipe(STATE, 'invalid')).toEqual(null);
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
      actions: actionsReducer(undefined, {
        type: ACTION_RECEIVE,
        action: REVISION.recipe.action,
      }),
      recipes: {
        ...INITIAL_STATE.newState.recipes,
        history: INITIAL_STATE.newState.recipes.history.set(
          REVISION.recipe.id,
          fromJS([REVISION.id]),
        ),
      },
      revisions: revisionsReducer(undefined, {
        type: REVISION_RECEIVE,
        revision: RECIPE.latest_revision,
      }),
    },
  };

  beforeEach(() => {
    jasmine.addMatchers(matchers);
  });

  it('should return the list of revisions', () => {
    expect(getRecipeHistory(STATE, REVISION.recipe.id)).toEqualImmutable(fromJS([REVISION]));
  });
});
