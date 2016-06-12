import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import controlActions, * as actionTypes from '../../static/control/js/actions/ControlActions'
import { fixtureRecipes, fixtureRevisions, initialState } from '../fixtures/fixtures';

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

    return store.dispatch(controlActions.makeApiRequest('fetchAllRecipes')).then(() => {
      expect(store.getActions()).toContain(expectedAction);
    });
  })

  describe('creates REQUEST_COMPLETE when an api response is returned', () => {

    it('returns with `status: success` if the request succeeded', () => {
      const expectedAction = { type: actionTypes.REQUEST_COMPLETE, status: 'success' };
      spyOn(window, 'fetch').and.returnValue(successPromise(fixtureRecipes));

      return store.dispatch(controlActions.makeApiRequest('fetchAllRecipes')).then(() => {
        expect(store.getActions()).toContain(expectedAction);
      });
    })

    it('returns with `status: error` if the request failed', () => {
      const expectedAction = { type: actionTypes.REQUEST_COMPLETE, status: 'error' };
      spyOn(window, 'fetch').and.returnValue(failurePromise());

      return store.dispatch(controlActions.makeApiRequest('fetchAllRecipes')).then(() => {
        expect(store.getActions()).toContain(expectedAction);
      });
    });

    it('creates a SET_NOTIFICATION action if provided', () => {
      const expectedAction = { type: actionTypes.SET_NOTIFICATION, notification: { messageType: 'error', 'message': 'Error fetching recipes.'} };
      spyOn(window, 'fetch').and.returnValue(failurePromise());

      return store.dispatch(controlActions.makeApiRequest('fetchAllRecipes')).then(() => {
        expect(store.getActions()).toContain(expectedAction);
      });
    });
  })

  it('creates RECIPES_RECEIVED when fetching recipes is successful', () => {
    const expectedAction = { type: actionTypes.RECIPES_RECEIVED, recipes: fixtureRecipes }
    spyOn(window, 'fetch').and.returnValue(successPromise(fixtureRecipes));

    return store.dispatch(controlActions.makeApiRequest('fetchAllRecipes')).then(() => {
      expect(window.fetch).toHaveBeenCalled();
      expect(window.fetch).toHaveBeenCalledWith('/api/v1/recipe/?format=json&', jasmine.any(Object));
      expect(store.getActions()).toContain(expectedAction);
    });

  });

  it('doesnt create any actions if fetching recipes is not needed', () => {
    const store = mockStore({ controlApp: { ...initialState, recipeListNeedsFetch: false } }, []);

    store.dispatch(controlActions.makeApiRequest('fetchAllRecipes'));
    expect(store.getActions()).toEqual([]);
  });

  it('creates SINGLE_RECIPE_RECEIVED when fetching a single RECIPE is successful', () => {
    const expectedAction = { type: actionTypes.SINGLE_RECIPE_RECEIVED, recipe: fixtureRecipes[0] };
    spyOn(window, 'fetch').and.returnValue(successPromise(fixtureRecipes[0]));

    return store.dispatch(controlActions.makeApiRequest('fetchSingleRecipe', { recipeId: 1 }))
      .then(() => {
        expect(window.fetch).toHaveBeenCalled();
        expect(window.fetch).toHaveBeenCalledWith('/api/v1/recipe/1/?format=json&', jasmine.any(Object));
        expect(store.getActions()).toContain(expectedAction);
      })
  });

  it('creates SINGLE_RECIPE_RECEIVED when fetching a single REVISION is successful', () => {
    const expectedAction = { type: actionTypes.SINGLE_RECIPE_RECEIVED, recipe: fixtureRevisions[0].recipe };
    spyOn(window, 'fetch').and.returnValue(successPromise(fixtureRevisions[0]));

    return store.dispatch(controlActions.makeApiRequest('fetchSingleRevision', { revisionId: 169 }))
      .then(() => {
        expect(window.fetch).toHaveBeenCalled();
        expect(window.fetch).toHaveBeenCalledWith('/api/v1/recipe_version/169/?format=json&', jasmine.any(Object));
        expect(store.getActions()).toContain(expectedAction);
      })
  });

  it('creates RECIPE_ADDED when adding a recipe is successful', () => {
    const expectedAction = { type: actionTypes.RECIPE_ADDED, recipe: fixtureRecipes[0] }
    spyOn(window, 'fetch').and.returnValue(successPromise(fixtureRecipes[0]));

    return store.dispatch(controlActions.makeApiRequest('addRecipe', fixtureRecipes[0]))
      .then(() => {
        expect(window.fetch).toHaveBeenCalled();
        expect(window.fetch).toHaveBeenCalledWith('/api/v1/recipe/?format=json&', jasmine.any(Object));
        expect(store.getActions()).toContain(expectedAction);
      })
  });

  it('creates RECIPE_UPDATED when updating a recipe is successful', () => {
    const expectedAction = { type: actionTypes.RECIPE_UPDATED, recipe: fixtureRecipes[0] };
    spyOn(window, 'fetch').and.returnValue(successPromise(fixtureRecipes[0]));

    return store.dispatch(controlActions.makeApiRequest('updateRecipe', { recipe: fixtureRecipes[0], recipeId: 1 }))
      .then(() => {
        expect(window.fetch).toHaveBeenCalled();
        expect(window.fetch).toHaveBeenCalledWith('/api/v1/recipe/1/?format=json&', jasmine.any(Object));
        expect(store.getActions()).toContain(expectedAction);
      })
  });

  it('creates RECIPE_DELETED when deleting a recipe is successful', () => {
    const expectedAction = { type: actionTypes.RECIPE_DELETED, recipeId: 1 };
    spyOn(window, 'fetch').and.returnValue(successPromise(fixtureRecipes));

    return store.dispatch(controlActions.makeApiRequest('deleteRecipe', { recipeId: 1 }))
      .then(() => {
        expect(window.fetch).toHaveBeenCalled();
        expect(window.fetch).toHaveBeenCalledWith('/api/v1/recipe/1/?format=json&', jasmine.any(Object));
        expect(store.getActions()).toContain(expectedAction);
      })
  });

})
