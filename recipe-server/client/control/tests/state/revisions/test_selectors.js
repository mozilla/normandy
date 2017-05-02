import { fromJS } from 'immutable';

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
      revisions: {
        ...INITIAL_STATE.newState.revisions,
        items: INITIAL_STATE.newState.revisions.items.set(REVISION.id, fromJS(REVISION)),
      },
    },
  };

  it('should return the revision', () => {
    expect(getRevision(STATE, REVISION.id)).toEqual(fromJS(REVISION));
  });

  it('should return `undefined` for invalid ID', () => {
    expect(getRevision(STATE, 'invalid')).toEqual(undefined);
  });

  it('should return default value for invalid ID with default provided', () => {
    expect(getRevision(STATE, 'invalid', 'default')).toEqual('default');
  });
});
