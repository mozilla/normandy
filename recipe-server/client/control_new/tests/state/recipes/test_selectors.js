import { fromJS } from 'immutable';
import * as matchers from 'jasmine-immutable-matchers';

import {
  ACTION_RECEIVE,
  RECIPE_RECEIVE,
  REVISION_RECEIVE,
} from 'control_new/state/action-types';
import actionsReducer from 'control_new/state/app/actions/reducers';
import recipesReducer from 'control_new/state/app/recipes/reducers';
import revisionsReducer from 'control_new/state/app/revisions/reducers';
import {
  getRecipe,
  getRecipeFilters,
  getRecipeHistory,
} from 'control_new/state/app/recipes/selectors';

import {
  FILTERS,
  RecipeFactory,
} from '.';

import {
  INITIAL_STATE,
} from '..';

import {
  RevisionFactory,
} from '../revisions';


describe('getRecipe', () => {
  const recipe = new RecipeFactory();

  const STATE = {
    ...INITIAL_STATE,
    app: {
      ...INITIAL_STATE.app,
      actions: actionsReducer(undefined, {
        type: ACTION_RECEIVE,
        action: recipe.action,
      }),
      recipes: recipesReducer(undefined, {
        type: RECIPE_RECEIVE,
        recipe: recipe.toObject(),
      }),
      revisions: revisionsReducer(undefined, {
        type: REVISION_RECEIVE,
        revision: recipe.latest_revision,
      }),
    },
  };

  beforeEach(() => {
    jasmine.addMatchers(matchers);
  });

  it('should return the recipe', () => {
    expect(getRecipe(STATE, recipe.id)).toEqualImmutable(recipe.toImmutable());
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
    app: {
      ...INITIAL_STATE.app,
      recipes: {
        ...INITIAL_STATE.app.recipes,
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
  const recipe = new RecipeFactory();
  const revision = new RevisionFactory();

  const STATE = {
    ...INITIAL_STATE,
    app: {
      ...INITIAL_STATE.app,
      actions: actionsReducer(undefined, {
        type: ACTION_RECEIVE,
        action: revision.recipe.action,
      }),
      recipes: {
        ...INITIAL_STATE.app.recipes,
        history: INITIAL_STATE.app.recipes.history.set(
          revision.recipe.id,
          revision.toImmutable(),
        ),
      },
      revisions: revisionsReducer(undefined, {
        type: REVISION_RECEIVE,
        revision: recipe.latest_revision,
      }),
    },
  };

  beforeEach(() => {
    jasmine.addMatchers(matchers);
  });

  it('should return the list of revisions', () => {
    expect(getRecipeHistory(STATE, revision.recipe.id)).toEqualImmutable(revision.toImmutable());
  });
});
