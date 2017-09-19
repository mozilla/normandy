import { fromJS } from 'immutable';

import { getAction } from 'control_old/state/actions/selectors';

import {
  ACTION,
} from '.';

import {
  INITIAL_STATE,
} from '..';


describe('getAction', () => {
  const STATE = {
    ...INITIAL_STATE,
    newState: {
      ...INITIAL_STATE.newState,
      actions: {
        ...INITIAL_STATE.newState.actions,
        items: INITIAL_STATE.newState.actions.items.set(ACTION.id, fromJS(ACTION)),
      },
    },
  };

  it('should return the action', () => {
    expect(getAction(STATE, ACTION.id)).toEqual(fromJS(ACTION));
  });

  it('should return `null` for invalid ID', () => {
    expect(getAction(STATE, 0)).toEqual(null);
  });

  it('should return default value for invalid ID with default provided', () => {
    expect(getAction(STATE, 0, 'default')).toEqual('default');
  });
});
