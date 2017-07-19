import { getAction } from 'control_new/state/app/actions/selectors';

import {
  ActionFactory,
} from '.';

import {
  INITIAL_STATE,
} from '..';


describe('getAction', () => {
  const action = new ActionFactory();

  const STATE = {
    ...INITIAL_STATE,
    app: {
      ...INITIAL_STATE.app,
      actions: {
        ...INITIAL_STATE.app.actions,
        items: INITIAL_STATE.app.actions.items.set(action.id, action.toImmutable()),
      },
    },
  };

  it('should return the action', () => {
    expect(getAction(STATE, action.id)).toEqual(action.toImmutable());
  });

  it('should return `null` for invalid ID', () => {
    expect(getAction(STATE, 0)).toEqual(null);
  });

  it('should return default value for invalid ID with default provided', () => {
    expect(getAction(STATE, 0, 'default')).toEqual('default');
  });
});
