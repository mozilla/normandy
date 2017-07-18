import { fromJS } from 'immutable';

import { getAction } from 'control_new/state/actions/selectors';

import {
  ACTION,
} from '.';

import {
  INITIAL_STATE,
} from '..';


describe('getAction', () => {
  const STATE = {
    ...INITIAL_STATE,
    app: {
      ...INITIAL_STATE.app,
      actions: {
        ...INITIAL_STATE.app.actions,
        items: INITIAL_STATE.app.actions.items.set(ACTION.id, fromJS(ACTION)),
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
