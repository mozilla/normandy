import { fromJS } from 'immutable';
import * as matchers from 'jasmine-immutable-matchers';

import {
  RECIPE_DELETE,
  REVISION_RECEIVE,
} from 'control_new/state/action-types';
import revisionsReducer from 'control_new/state/app/revisions/reducers';

import {
  INITIAL_STATE,
  REVISION,
} from '.';


describe('Revisions reducer', () => {
  beforeEach(() => {
    jasmine.addMatchers(matchers);
  });

  it('should return initial state by default', () => {
    expect(revisionsReducer(undefined, {})).toEqual(INITIAL_STATE);
  });

  it('should handle REVISION_RECEIVE', () => {
    const reducedRevision = {
      ...REVISION,
      recipe: {
        ...REVISION.recipe,
        action_id: REVISION.recipe.action.id,
      },
      approval_request_id: null,
    };

    delete reducedRevision.recipe.action;
    delete reducedRevision.approval_request;

    const updatedState = revisionsReducer(undefined, {
      type: REVISION_RECEIVE,
      revision: REVISION,
    });

    expect(updatedState.items).toEqualImmutable(
      INITIAL_STATE.items.set(REVISION.id, fromJS(reducedRevision)),
    );
  });

  it('should handle RECIPE_DELETE', () => {
    const state = revisionsReducer(undefined, {
      type: REVISION_RECEIVE,
      revision: REVISION,
    });

    const updatedState = revisionsReducer(state, {
      type: RECIPE_DELETE,
      recipeId: REVISION.recipe.id,
    });

    expect(updatedState).toEqual(INITIAL_STATE);
  });
});
