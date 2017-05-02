import { fromJS } from 'immutable';

import {
  REVISION_RECEIVE,
} from 'control/state/action-types';
import revisionsReducer from 'control/state/revisions/reducers';

import {
  INITIAL_STATE,
  REVISION,
} from '.';


describe('Revisions reducer', () => {
  it('should return initial state by default', () => {
    expect(revisionsReducer(undefined, {})).toEqual(INITIAL_STATE);
  });

  it('should handle REVISION_RECEIVED', () => {
    expect(revisionsReducer(undefined, {
      type: REVISION_RECEIVE,
      revision: REVISION,
    })).toEqual({
      ...INITIAL_STATE,
      items: INITIAL_STATE.items.set(REVISION.id, fromJS(REVISION)),
    });
  });
});
