import { fromJS } from 'immutable';
import * as matchers from 'jasmine-immutable-matchers';

import {
  ACTION_RECEIVE,
  REVISION_RECEIVE,
} from 'control/state/action-types';
import actionsReducer from 'control/state/actions/reducers';
import revisionsReducer from 'control/state/revisions/reducers';
import { getRevision } from 'control/state/revisions/selectors';

import {
  REVISION,
} from '.';

import {
  INITIAL_STATE,
} from '..';


describe('getRevision', () => {
  const STATE = {
    ...INITIAL_STATE,
    newState: {
      ...INITIAL_STATE.newState,
      actions: actionsReducer(undefined, {
        type: ACTION_RECEIVE,
        action: REVISION.recipe.action,
      }),
      revisions: revisionsReducer(undefined, {
        type: REVISION_RECEIVE,
        revision: REVISION,
      }),
    },
  };

  beforeEach(() => {
    jasmine.addMatchers(matchers);
  });

  it('should return the revision', () => {
    expect(getRevision(STATE, REVISION.id)).toEqualImmutable(fromJS(REVISION));
  });

  it('should return `null` for invalid ID', () => {
    expect(getRevision(STATE, 'invalid')).toEqual(null);
  });

  it('should return default value for invalid ID with default provided', () => {
    expect(getRevision(STATE, 'invalid', 'default')).toEqual('default');
  });
});
