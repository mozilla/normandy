import appReducer from 'control/reducers';
import * as actions from 'control/actions/ControlActions';
import {
  initialState,
} from 'control/tests/fixtures';

describe('controlApp reducer', () => {
  it('should return initial state by default', () => {
    expect(appReducer(undefined, {})).toEqual(initialState);
  });

  it('should handle REQUEST_IN_PROGRESS', () => {
    expect(appReducer(undefined, {
      type: actions.REQUEST_IN_PROGRESS,
    })).toEqual({
      ...initialState,
      controlApp: {
        isFetching: true,
      },
    });
  });

  it('should handle REQUEST_COMPLETE', () => {
    expect(appReducer(undefined, {
      type: actions.REQUEST_COMPLETE,
    })).toEqual({
      ...initialState,
      controlApp: {
        isFetching: false,
      },
    });
  });
});
