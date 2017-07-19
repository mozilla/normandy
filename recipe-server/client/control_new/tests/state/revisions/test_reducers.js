import { fromJS } from 'immutable';
import * as matchers from 'jasmine-immutable-matchers';

import {
  RECIPE_DELETE,
  REVISION_RECEIVE,
} from 'control_new/state/action-types';
import revisionsReducer from 'control_new/state/app/revisions/reducers';

import {
  INITIAL_STATE,
  RevisionFactory,
} from '.';


describe('Revisions reducer', () => {
  const revision = new RevisionFactory();

  beforeEach(() => {
    jasmine.addMatchers(matchers);
  });

  it('should', () => {
    expect(revision.toObject()).toEqual({});
  });

  it('should return initial state by default', () => {
    expect(revisionsReducer(undefined, {})).toEqual(INITIAL_STATE);
  });

  it('should handle REVISION_RECEIVE', () => {
    const reducedRevision = {
      ...revision.toObject(),
      recipe: {
        ...revision.recipe,
        action_id: revision.recipe.action.id,
      },
      approval_request_id: null,
    };

    delete reducedRevision.recipe.action;
    delete reducedRevision.approval_request;

    const updatedState = revisionsReducer(undefined, {
      type: REVISION_RECEIVE,
      revision: revision.toObject(),
    });

    expect(updatedState.items).toEqualImmutable(
      INITIAL_STATE.items.set(revision.id, revision.toImmutable()),
    );
  });

  it('should handle RECIPE_DELETE', () => {
    const state = revisionsReducer(undefined, {
      type: REVISION_RECEIVE,
      revision: revision.toObject(),
    });

    const updatedState = revisionsReducer(state, {
      type: RECIPE_DELETE,
      recipeId: revision.recipe.id,
    });

    expect(updatedState).toEqual(INITIAL_STATE);
  });
});
