import { fromJS } from 'immutable';

import {
  ACTION_RECEIVE,
} from 'control_old/state/action-types';
import actionsReducer from 'control_old/state/actions/reducers';

import {
  INITIAL_STATE,
  ACTION,
} from '.';


describe('Actions reducer', () => {
  it('should return initial state by default', () => {
    expect(actionsReducer(undefined, {})).toEqual(INITIAL_STATE);
  });

  it('should handle ACTION_RECEIVE', () => {
    expect(actionsReducer(undefined, {
      type: ACTION_RECEIVE,
      action: ACTION,
    })).toEqual({
      ...INITIAL_STATE,
      items: INITIAL_STATE.items.set(ACTION.id, fromJS(ACTION)),
    });
  });
});
