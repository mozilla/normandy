import { List, Map, is } from 'immutable';

import {
  SESSION_INFO_RECEIVE,
  SESSION_INFO_HISTORY_VIEW,
} from 'control_new/state/action-types';
import sessionReducer from 'control_new/state/app/session/reducers';
import {
  INITIAL_STATE,
} from 'control_new/tests/state/session';


describe('Session reducer', () => {
  it('should return initial state by default', () => {
    expect(sessionReducer(undefined, { type: 'INITIAL' })).toEqual(INITIAL_STATE);
  });

  it('should handle SESSION_INFO_RECEIVE', () => {
    expect(sessionReducer(undefined, {
      type: SESSION_INFO_RECEIVE,
      history: [1, 2, 3],
    })).toEqual({ history: new List([1, 2, 3]) });
  });

  describe('SESSION_INFO_HISTORY_VIEW', () => {
    it('should add an item to the state history', () => {
      const url = 'mozilla.com';
      const caption = 'test';
      const fakeItem = new Map({ type: 'test', url, caption });

      const result = sessionReducer(undefined, {
        type: SESSION_INFO_HISTORY_VIEW,
        item: fakeItem,
      });

      expect(is(result.history, new List([fakeItem]))).toBe(true);
    });

    it('should only have unique items in history', () => {
      const url = 'mozilla.com';
      const fakeItem = new Map({ type: 'test', url, caption: '1' });
      const fakeItem2 = new Map({ type: 'test', url, caption: '2' });

      let result = sessionReducer(undefined, {
        type: SESSION_INFO_HISTORY_VIEW,
        item: fakeItem,
      });

      expect(is(result.history, new List([fakeItem]))).toBe(true);

      result = sessionReducer(result, {
        type: SESSION_INFO_HISTORY_VIEW,
        item: fakeItem,
      });

      expect(is(result.history, new List([fakeItem]))).toBe(true);

      result = sessionReducer(result, {
        type: SESSION_INFO_HISTORY_VIEW,
        item: fakeItem2,
      });

      expect(is(result.history, new List([fakeItem2, fakeItem]))).toBe(true);
    });

    it('should arrange order from latest to oldest', () => {
      const url = 'mozilla.com';
      const fakeItem = new Map({ type: 'test', url, caption: '1' });
      const fakeItem2 = new Map({ type: 'test', url, caption: '2' });
      const fakeItem3 = new Map({ type: 'test', url, caption: '3' });

      let result = sessionReducer(undefined, {
        type: SESSION_INFO_HISTORY_VIEW,
        item: fakeItem,
      });

      expect(is(result.history, new List([fakeItem]))).toBe(true);

      result = sessionReducer(result, {
        type: SESSION_INFO_HISTORY_VIEW,
        item: fakeItem2,
      });

      expect(is(result.history, new List([fakeItem2, fakeItem]))).toBe(true);

      result = sessionReducer(result, {
        type: SESSION_INFO_HISTORY_VIEW,
        item: fakeItem3,
      });

      expect(is(result.history, new List([fakeItem3, fakeItem2, fakeItem]))).toBe(true);

      result = sessionReducer(result, {
        type: SESSION_INFO_HISTORY_VIEW,
        item: fakeItem,
      });

      expect(is(result.history, new List([fakeItem, fakeItem3, fakeItem2]))).toBe(true);
    });
  });
});

