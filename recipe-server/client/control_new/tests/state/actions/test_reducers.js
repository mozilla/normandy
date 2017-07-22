import { fromJS } from 'immutable';

import {
  ACTION_RECEIVE,
} from 'control_new/state/action-types';
import actionsReducer from 'control_new/state/app/actions/reducers';
import {
  INITIAL_STATE,
  ActionFactory,
} from 'control_new/tests/state/actions';


describe('Actions reducer', () => {
  it('should return initial state by default', () => {
    expect(actionsReducer(undefined, {})).toEqual(INITIAL_STATE);
  });

  it('should handle ACTION_RECEIVE', () => {
    const action = ActionFactory.build();

    expect(actionsReducer(undefined, {
      type: ACTION_RECEIVE,
      action,
    })).toEqual({
      ...INITIAL_STATE,
      items: INITIAL_STATE.items.set(action.id, fromJS(action)),
    });
  });
});
