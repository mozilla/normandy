import { fromJS } from 'immutable';

import { getAction } from 'control_new/state/app/actions/selectors';
import {
  INITIAL_STATE,
} from 'control_new/tests/state';
import {
  ActionFactory,
} from 'control_new/tests/state/actions';


describe('getAction', () => {
  const action = ActionFactory.build();

  const STATE = {
    ...INITIAL_STATE,
    app: {
      ...INITIAL_STATE.app,
      actions: {
        ...INITIAL_STATE.app.actions,
        items: INITIAL_STATE.app.actions.items.set(action.id, fromJS(action)),
      },
    },
  };

  it('should return the action', () => {
    expect(getAction(STATE, action.id)).toEqual(fromJS(action));
  });

  it('should return `null` for invalid ID', () => {
    expect(getAction(STATE, 0)).toEqual(null);
  });

  it('should return default value for invalid ID with default provided', () => {
    expect(getAction(STATE, 0, 'default')).toEqual('default');
  });
});
