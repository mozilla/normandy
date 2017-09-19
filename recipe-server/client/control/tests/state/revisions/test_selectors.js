import { fromJS } from 'immutable';
import * as matchers from 'jasmine-immutable-matchers';

import {
  ACTION_RECEIVE,
  REVISION_RECEIVE,
  USER_RECEIVE,
} from 'control/state/action-types';
import actionsReducer from 'control/state/app/actions/reducers';
import revisionsReducer from 'control/state/app/revisions/reducers';
import usersReducer from 'control/state/app/users/reducers';
import { getRevision } from 'control/state/app/revisions/selectors';
import {
  INITIAL_STATE,
} from 'control/tests/state';
import {
  RevisionFactory,
} from 'control/tests/state/revisions';


describe('getRevision', () => {
  const revision = RevisionFactory.build();

  const STATE = {
    ...INITIAL_STATE,
    app: {
      ...INITIAL_STATE.app,
      actions: actionsReducer(undefined, {
        type: ACTION_RECEIVE,
        action: revision.recipe.action,
      }),
      revisions: revisionsReducer(undefined, {
        type: REVISION_RECEIVE,
        revision,
      }),
      users: usersReducer(undefined, {
        type: USER_RECEIVE,
        user: revision.user,
      }),
    },
  };

  beforeEach(() => {
    jasmine.addMatchers(matchers);
  });

  it('should return the revision', () => {
    expect(getRevision(STATE, revision.id)).toEqualImmutable(fromJS(revision));
  });

  it('should return `null` for invalid ID', () => {
    expect(getRevision(STATE, 'invalid')).toEqual(null);
  });

  it('should return default value for invalid ID with default provided', () => {
    expect(getRevision(STATE, 'invalid', 'default')).toEqual('default');
  });
});
