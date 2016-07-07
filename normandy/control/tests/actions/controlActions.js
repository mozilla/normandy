import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock from 'fetch-mock';

import { fixtureRecipes, initialState } from '../fixtures/fixtures';
import * as actionTypes from '../../static/control/js/actions/ControlActions';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);
const store = mockStore({ controlApp: initialState });

describe('controlApp Actions', () => {
  beforeEach(() => {
    store.clearActions();
    fetchMock.restore();
  });

  afterEach(() => {
    expect(fetchMock.calls().unmatched).toEqual([]);
  });

  it('creates REQUEST_IN_PROGRESS when initiating an api call', () => {
    const expectedAction = { type: actionTypes.REQUEST_IN_PROGRESS };
    fetchMock.mock('/api/v1/recipe/', 'GET', fixtureRecipes);

    return store.dispatch(actionTypes.makeApiRequest('fetchAllRecipes'))
    .then(() => {
      expect(store.getActions()).toContain(expectedAction);
    });
  });

  describe('creates REQUEST_COMPLETE when an api response is returned', () => {
    it('returns with `status: success` if the request succeeded', () => {
      const expectedAction = { type: actionTypes.REQUEST_COMPLETE, status: 'success' };
      fetchMock.mock('/api/v1/recipe/', 'GET', fixtureRecipes);

      return store.dispatch(actionTypes.makeApiRequest('fetchAllRecipes'))
      .then(() => {
        expect(store.getActions()).toContain(expectedAction);
      });
    });

    it('returns with `status: error` if the request failed', () => {
      const expectedAction = { type: actionTypes.REQUEST_COMPLETE, status: 'error' };
      fetchMock.mock('/api/v1/recipe/', 'GET', { status: 500 });

      return store.dispatch(actionTypes.makeApiRequest('fetchAllRecipes'))
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
      fetchMock.mock('/api/v1/recipe/', 'GET', { status: 500 });

      return store.dispatch(actionTypes.makeApiRequest('fetchAllRecipes')).catch(() => {
        expect(store.getActions()).toContain(expectedAction);
      });
    });
  });

  it('makes a proper API request for fetchAllRecipes', () => {
    fetchMock.mock('/api/v1/recipe/', 'GET', fixtureRecipes);

    return store.dispatch(actionTypes.makeApiRequest('fetchAllRecipes'))
    .then(() => {
      expect(fetchMock.calls('/api/v1/recipe/').length).toEqual(1);
    });
  });

  it('makes a proper API request for fetchSingleRecipe', () => {
    fetchMock.mock('/api/v1/recipe/1/', 'GET', fixtureRecipes[0]);

    return store.dispatch(actionTypes.makeApiRequest('fetchSingleRecipe', { recipeId: 1 }))
    .then(() => {
      expect(fetchMock.calls('/api/v1/recipe/1/').length).toEqual(1);
    });
  });

  it('makes a proper API request for fetchSingleRevision', () => {
    fetchMock.mock('/api/v1/recipe_version/169/', 'GET', fixtureRecipes[0]);

    return store.dispatch(actionTypes.makeApiRequest('fetchSingleRevision', { revisionId: 169 }))
    .then(() => {
      expect(fetchMock.calls('/api/v1/recipe_version/169/').length).toEqual(1);
    });
  });

  it('makes a proper API request for addRecipe', () => {
    fetchMock.mock('/api/v1/recipe/', 'POST', fixtureRecipes[0]);

    return store.dispatch(actionTypes.makeApiRequest('addRecipe', { recipe: fixtureRecipes[0] }))
    .then(() => {
      const calls = fetchMock.calls('/api/v1/recipe/');
      expect(calls[0][1].body).toEqual(JSON.stringify(fixtureRecipes[0]));
    });
  });

  it('makes a proper API request for updateRecipe', () => {
    fetchMock.mock('/api/v1/recipe/1/', 'PATCH', fixtureRecipes[0]);

    return store.dispatch(actionTypes.makeApiRequest('updateRecipe', {
      recipe: fixtureRecipes[0], recipeId: 1,
    }))
    .then(() => {
      const calls = fetchMock.calls('/api/v1/recipe/1/');
      expect(calls[0][1].body).toEqual(JSON.stringify(fixtureRecipes[0]));
    });
  });

  it('makes a proper API request for deleteRecipe', () => {
    fetchMock.mock('/api/v1/recipe/1/', 'DELETE', fixtureRecipes[0]);

    return store.dispatch(actionTypes.makeApiRequest('deleteRecipe', { recipeId: 1 }))
    .then(() => {
      expect(fetchMock.calls('/api/v1/recipe/1/').length).toEqual(1);
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
