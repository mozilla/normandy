import {
  ACTION_RECEIVE,
} from 'control_new/state/action-types';
import actionsReducer from 'control_new/state/app/actions/reducers';

import {
  INITIAL_STATE,
  ActionFactory,
} from '.';


describe('Actions reducer', () => {
  it('should return initial state by default', () => {
    expect(actionsReducer(undefined, {})).toEqual(INITIAL_STATE);
  });

  it('should handle ACTION_RECEIVE', () => {
    const action = new ActionFactory();

    expect(actionsReducer(undefined, {
      type: ACTION_RECEIVE,
      action: action.toObject(),
    })).toEqual({
      ...INITIAL_STATE,
      items: INITIAL_STATE.items.set(action.id, action.toImmutable()),
    });
  });
});
