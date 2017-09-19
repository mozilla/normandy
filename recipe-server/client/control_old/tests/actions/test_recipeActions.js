import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock from 'fetch-mock';

import makeApiRequest from 'control_old/api';

import { fixtureRecipes, initialState } from 'control_old/tests/fixtures';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);
const store = mockStore({ ...initialState });

describe('Recipe Actions', () => {
  afterEach(() => {
    expect(fetchMock.calls().unmatched).toEqual([]);
    store.clearActions();
    fetchMock.restore();
  });

  it('makes a proper API request for fetchAllRecipes', () => {
    fetchMock.get('/api/v1/recipe/', fixtureRecipes);

    return store.dispatch(makeApiRequest('fetchAllRecipes'))
    .then(() => {
      expect(fetchMock.calls('/api/v1/recipe/').length).toEqual(1);
    });
  });

  it('makes a proper API request for fetchSingleRecipe', () => {
    fetchMock.get('/api/v1/recipe/1/', fixtureRecipes[0]);

    return store.dispatch(makeApiRequest('fetchSingleRecipe', { recipeId: 1 }))
    .then(() => {
      expect(fetchMock.calls('/api/v1/recipe/1/').length).toEqual(1);
    });
  });

  it('makes a proper API request for fetchSingleRevision', () => {
    fetchMock.get('/api/v1/recipe_version/169/', fixtureRecipes[0]);

    return store.dispatch(makeApiRequest('fetchSingleRevision', { revisionId: 169 }))
    .then(() => {
      expect(fetchMock.calls('/api/v1/recipe_version/169/').length).toEqual(1);
    });
  });

  it('makes a proper API request for addRecipe', () => {
    fetchMock.post('/api/v1/recipe/', fixtureRecipes[0]);

    return store.dispatch(makeApiRequest('addRecipe', { recipe: fixtureRecipes[0] }))
    .then(() => {
      const calls = fetchMock.calls('/api/v1/recipe/');
      expect(calls[0][1].body).toEqual(JSON.stringify(fixtureRecipes[0]));
    });
  });

  it('makes a proper API request for updateRecipe', () => {
    fetchMock.mock('/api/v1/recipe/1/', fixtureRecipes[0], { method: 'PATCH' });

    return store.dispatch(makeApiRequest('updateRecipe', {
      recipe: fixtureRecipes[0], recipeId: 1,
    }))
    .then(() => {
      const calls = fetchMock.calls('/api/v1/recipe/1/');
      expect(calls[0][1].body).toEqual(JSON.stringify(fixtureRecipes[0]));
    });
  });

  it('makes a proper API request for deleteRecipe', () => {
    fetchMock.delete('/api/v1/recipe/1/', fixtureRecipes[0]);

    return store.dispatch(makeApiRequest('deleteRecipe', { recipeId: 1 }))
    .then(() => {
      expect(fetchMock.calls('/api/v1/recipe/1/').length).toEqual(1);
    });
  });

  it('makes a proper API request for openApprovalRequest', () => {
    fetchMock.post('/api/v1/recipe_revision/123/request_approval/', {});
    return store.dispatch(makeApiRequest('openApprovalRequest', {
      revisionId: 123,
    }))
      .then(() => {
        expect(fetchMock.calls('/api/v1/recipe_revision/123/request_approval/').length).toEqual(1);
      });
  });

  it('makes a proper API request for approveApprovalRequest', () => {
    fetchMock.post('/api/v1/approval_request/123/approve/', {});

    return store.dispatch(makeApiRequest('approveApprovalRequest', {
      requestId: 123,
    }))
      .then(() => {
        expect(fetchMock.calls('/api/v1/approval_request/123/approve/').length).toEqual(1);
      });
  });

  it('makes a proper API request for rejectApprovalRequest', () => {
    fetchMock.post('/api/v1/approval_request/123/reject/', {});

    return store.dispatch(makeApiRequest('rejectApprovalRequest', {
      requestId: 123,
    }))
      .then(() => {
        expect(fetchMock.calls('/api/v1/approval_request/123/reject/').length).toEqual(1);
      });
  });

  it('makes a proper API request for closeApprovalRequest', () => {
    fetchMock.post('/api/v1/approval_request/123/close/', {});

    return store.dispatch(makeApiRequest('closeApprovalRequest', {
      requestId: 123,
    }))
      .then(() => {
        expect(fetchMock.calls('/api/v1/approval_request/123/close/').length).toEqual(1);
      });
  });
});
