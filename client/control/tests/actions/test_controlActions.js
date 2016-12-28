import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock from 'fetch-mock';

import makeApiRequest from 'control/api';
import * as actionTypes from 'control/actions/ControlActions';

import { fixtureRecipes, initialState } from 'control/tests/fixtures';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);
const store = mockStore({ ...initialState });

describe('controlApp Actions', () => {
  afterEach(() => {
    expect(fetchMock.calls().unmatched).toEqual([]);
    store.clearActions();
    fetchMock.restore();
  });

  it('creates REQUEST_IN_PROGRESS when initiating an api call', () => {
    const expectedAction = { type: actionTypes.REQUEST_IN_PROGRESS };
    fetchMock.get('/api/v1/recipe/', fixtureRecipes);

    return store.dispatch(makeApiRequest('fetchAllRecipes'))
    .then(() => {
      expect(store.getActions()).toContain(expectedAction);
    });
  });

  describe('creates REQUEST_COMPLETE when an api response is returned', () => {
    it('returns with `status: success` if the request succeeded', () => {
      const expectedAction = { type: actionTypes.REQUEST_COMPLETE, status: 'success' };
      fetchMock.get('/api/v1/recipe/', fixtureRecipes);

      return store.dispatch(makeApiRequest('fetchAllRecipes'))
      .then(() => {
        expect(store.getActions()).toContain(expectedAction);
      });
    });

    it('returns with `status: error` if the request failed', () => {
      const expectedAction = { type: actionTypes.REQUEST_COMPLETE, status: 'error' };
      fetchMock.get('/api/v1/recipe/', { status: 500 });

      return store.dispatch(makeApiRequest('fetchAllRecipes'))
      .catch(() => {
        expect(store.getActions()).toContain(expectedAction);
      });
    });

    it('creates a SHOW_NOTIFICATION action if provided', () => {
      const expectedAction = {
        type: actionTypes.SHOW_NOTIFICATION,
        notification: {
          messageType: 'error',
          message: 'Error fetching recipes.',
          id: jasmine.any(Number),
        },
      };
      fetchMock.get('/api/v1/recipe/', { status: 500 });

      return store.dispatch(makeApiRequest('fetchAllRecipes')).catch(() => {
        expect(store.getActions()).toContain(expectedAction);
      });
    });
  });

  describe('showNotification', () => {
    it('automatically dismisses notifications after 10 seconds', async () => {
      jasmine.clock().install();

      const notification = { messageType: 'success', message: 'message' };
      await store.dispatch(actionTypes.showNotification(notification));

      const dismissAction = actionTypes.dismissNotification(notification.id);
      expect(store.getActions()).not.toContain(dismissAction);
      jasmine.clock().tick(10001);
      expect(store.getActions()).toContain(dismissAction);

      jasmine.clock().uninstall();
    });
  });
});
