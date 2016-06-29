import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import { fixtureRecipes, fixtureRevisions, initialState } from '../fixtures/fixtures';
import * as actionTypes from '../../static/control/js/actions/ControlActions'

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);
const store = mockStore({ controlApp: initialState });

const successPromise = (responseData) => {
  return Promise.resolve(new Response(JSON.stringify(responseData), {
    Headers: 'Content-Type: application/json',
    status: 200
  }));
}

const failurePromise = () => {
  return Promise.resolve(new Response('{}', {
    Headers: 'Content-Type: application/json',
    status: 403
  }));
}


describe('controlApp Actions', () => {

  beforeEach(() => {
    store.clearActions();
  });

  it('creates REQUEST_IN_PROGRESS when initiating an api call', () => {
    const expectedAction = { type: actionTypes.REQUEST_IN_PROGRESS };
    spyOn(window, 'fetch').and.returnValue(successPromise(fixtureRecipes));

    return store.dispatch(actionTypes.makeApiRequest('fetchAllRecipes'))
    .then(() => {
      expect(store.getActions()).toContain(expectedAction);
    });
  })

  describe('creates REQUEST_COMPLETE when an api response is returned', () => {

    it('returns with `status: success` if the request succeeded', () => {
      const expectedAction = { type: actionTypes.REQUEST_COMPLETE, status: 'success' };
      spyOn(window, 'fetch').and.returnValue(successPromise(fixtureRecipes));

      return store.dispatch(actionTypes.makeApiRequest('fetchAllRecipes'))
      .then(() => {
        expect(store.getActions()).toContain(expectedAction);
      });
    })

    it('returns with `status: error` if the request failed', () => {
      const expectedAction = { type: actionTypes.REQUEST_COMPLETE, status: 'error' };
      spyOn(window, 'fetch').and.returnValue(failurePromise());

      return store.dispatch(actionTypes.makeApiRequest('fetchAllRecipes'))
      .catch(() => {
        expect(store.getActions()).toContain(expectedAction);
      });
    });

    it('creates a SET_NOTIFICATION action if provided', () => {
      const expectedAction = { type: actionTypes.SET_NOTIFICATION, notification: { messageType: 'error', 'message': 'Error fetching recipes.'} };
      spyOn(window, 'fetch').and.returnValue(failurePromise());

      return store.dispatch(actionTypes.makeApiRequest('fetchAllRecipes')).catch(() => {
        expect(store.getActions()).toContain(expectedAction);
      });
    });
  })

  it('makes a proper API request for fetchAllRecipes', () => {
    spyOn(window, 'fetch').and.returnValue(successPromise(fixtureRecipes));

    return store.dispatch(actionTypes.makeApiRequest('fetchAllRecipes'))
    .then((response) => {
      expect(window.fetch).toHaveBeenCalledWith('/api/v1/recipe/', jasmine.objectContaining({ method: 'GET' }));
    });
  });

  it('makes a proper API request for fetchSingleRecipe', () => {
    spyOn(window, 'fetch').and.returnValue(successPromise(fixtureRecipes[0]));

    return store.dispatch(actionTypes.makeApiRequest('fetchSingleRecipe', { recipeId: 1 }))
    .then((response) => {
      expect(window.fetch).toHaveBeenCalledWith('/api/v1/recipe/1/', jasmine.objectContaining({ method: 'GET' }));
    })
  });

  it('makes a proper API request for fetchSingleRevision', () => {
    spyOn(window, 'fetch').and.returnValue(successPromise(fixtureRevisions[0]));

    return store.dispatch(actionTypes.makeApiRequest('fetchSingleRevision', { revisionId: 169 }))
    .then((response) => {
      expect(window.fetch).toHaveBeenCalledWith('/api/v1/recipe_version/169/', jasmine.objectContaining({ method: 'GET' }));
    })
  });

  it('makes a proper API request for addRecipe', () => {
    spyOn(window, 'fetch').and.returnValue(successPromise(fixtureRecipes[0]));

    return store.dispatch(actionTypes.makeApiRequest('addRecipe', { recipe: fixtureRecipes[0] }))
    .then((response) => {
      expect(window.fetch).toHaveBeenCalledWith('/api/v1/recipe/', jasmine.objectContaining({
        method: 'POST',
        body: JSON.stringify(fixtureRecipes[0])
      }));
    })
  });

  it('makes a proper API request for updateRecipe', () => {
    spyOn(window, 'fetch').and.returnValue(successPromise(fixtureRecipes[0]));

    return store.dispatch(actionTypes.makeApiRequest('updateRecipe', { recipe: fixtureRecipes[0], recipeId: 1 }))
    .then((response) => {
      expect(window.fetch).toHaveBeenCalledWith('/api/v1/recipe/1/', jasmine.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(fixtureRecipes[0])
      }));
    })
  });

  it('makes a proper API request for deleteRecipe', () => {
    spyOn(window, 'fetch').and.returnValue(successPromise(fixtureRecipes.filter(recipe => recipe.id !== 1)));

    return store.dispatch(actionTypes.makeApiRequest('deleteRecipe', { recipeId: 1 }))
    .then((response) => {
      expect(window.fetch).toHaveBeenCalledWith('/api/v1/recipe/1/', jasmine.objectContaining({ method: 'DELETE' }));
    })
  });

})
