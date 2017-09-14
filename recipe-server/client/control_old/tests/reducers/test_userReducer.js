import appReducer from 'control_old/reducers';
import { RECEIVED_USER_INFO } from 'control_old/actions/ControlActions';

import {
  initialState,
} from 'control_old/tests/fixtures';

/**
 * Column reducer tests
 */
describe('User reducer', () => {
  it('should return initial state by default', () => {
    expect(appReducer(undefined, {})).toEqual(initialState);
  });

  it('should handle RECEIVED_USER_INFO', () => {
    const exampleUser = {
      id: 2716057,
      first_name: 'Bender',
      last_name: 'Rodriguez',
    };

    expect(appReducer(undefined, {
      type: RECEIVED_USER_INFO,
      user: exampleUser,
    })).toEqual({
      ...initialState,
      user: exampleUser,
    });
  });
});
