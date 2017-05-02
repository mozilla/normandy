import * as matchers from 'jasmine-immutable-matchers';

import { DEFAULT_REQUEST } from 'control/state/constants';
import { getRequest } from 'control/state/requests/selectors';

import {
  INITIAL_STATE,
} from '..';


describe('getRequest', () => {
  const REQUEST = DEFAULT_REQUEST.set('inProgress', true);
  const STATE = {
    ...INITIAL_STATE,
    newState: {
      ...INITIAL_STATE.newState,
      requests: INITIAL_STATE.newState.requests.set('test', REQUEST),
    },
  };

  beforeEach(() => {
    jasmine.addMatchers(matchers);
  });

  it('should return the request', () => {
    expect(getRequest(STATE, 'test')).toEqualImmutable(REQUEST);
  });

  it('should return the DEFAULT_REQUEST object for invalid ID', () => {
    expect(getRequest(STATE, 'invalid')).toEqualImmutable(DEFAULT_REQUEST);
  });

  it('should return default value for invalid ID with default provided', () => {
    expect(getRequest(STATE, 'invalid', 'default')).toEqual('default');
  });
});
