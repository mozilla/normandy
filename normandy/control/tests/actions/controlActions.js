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

  it('creates RECIPES_RECEIVED when fetching recipes is successful', () => {
    const expectedAction = { type: actionTypes.RECIPES_RECEIVED, recipes: fixtureRecipes }
    spyOn(window, 'fetch').and.returnValue(successPromise(fixtureRecipes));

    return store.dispatch(actionTypes.makeApiRequest('fetchAllRecipes'))
    .then((response) => {
      store.dispatch(actionTypes.recipesReceived(response));

      expect(window.fetch).toHaveBeenCalled();
      expect(window.fetch).toHaveBeenCalledWith('/api/v1/recipe/', jasmine.objectContaining({ method: 'GET' }));
      expect(store.getActions()).toContain(expectedAction);
    });
  });

  it('creates SINGLE_RECIPE_RECEIVED when fetching by RECIPE id is successful', () => {
    const expectedAction = { type: actionTypes.SINGLE_RECIPE_RECEIVED, recipe: fixtureRecipes[0] };
    spyOn(window, 'fetch').and.returnValue(successPromise(fixtureRecipes[0]));

    return store.dispatch(actionTypes.makeApiRequest('fetchSingleRecipe', { recipeId: 1 }))
    .then((response) => {
      store.dispatch(actionTypes.singleRecipeReceived(response));

      expect(window.fetch).toHaveBeenCalled();
      expect(window.fetch).toHaveBeenCalledWith('/api/v1/recipe/1/', jasmine.objectContaining({ method: 'GET' }));
      expect(store.getActions()).toContain(expectedAction);
    })
  });

  it('creates SINGLE_RECIPE_RECEIVED when fetching by REVISION id is successful', () => {
    const expectedAction = { type: actionTypes.SINGLE_RECIPE_RECEIVED, recipe: fixtureRevisions[0].recipe };
    spyOn(window, 'fetch').and.returnValue(successPromise(fixtureRevisions[0]));

    return store.dispatch(actionTypes.makeApiRequest('fetchSingleRecipe', { revisionId: 169 }))
    .then((response) => {
      store.dispatch(actionTypes.singleRecipeReceived(response.recipe));

      expect(window.fetch).toHaveBeenCalled();
      expect(window.fetch).toHaveBeenCalledWith('/api/v1/recipe_version/169/', jasmine.objectContaining({ method: 'GET' }));
      expect(store.getActions()).toContain(expectedAction);
    })
  });

  it('creates RECIPE_ADDED when adding a recipe is successful', () => {
    const expectedAction = { type: actionTypes.RECIPE_ADDED, recipe: fixtureRecipes[0] }
    spyOn(window, 'fetch').and.returnValue(successPromise(fixtureRecipes[0]));

    return store.dispatch(actionTypes.makeApiRequest('addRecipe', fixtureRecipes[0]))
    .then((response) => {
      store.dispatch(actionTypes.recipeAdded(response));

      expect(window.fetch).toHaveBeenCalled();
      expect(window.fetch).toHaveBeenCalledWith('/api/v1/recipe/', jasmine.objectContaining({ method: 'POST' }));
      expect(store.getActions()).toContain(expectedAction);
    })
  });

  it('creates RECIPE_UPDATED when updating a recipe is successful', () => {
    const expectedAction = { type: actionTypes.RECIPE_UPDATED, recipe: fixtureRecipes[0] };
    spyOn(window, 'fetch').and.returnValue(successPromise(fixtureRecipes[0]));

    return store.dispatch(actionTypes.makeApiRequest('updateRecipe', { recipe: fixtureRecipes[0], recipeId: 1 }))
    .then((response) => {
      store.dispatch(actionTypes.recipeUpdated(response));

      expect(window.fetch).toHaveBeenCalled();
      expect(window.fetch).toHaveBeenCalledWith('/api/v1/recipe/1/', jasmine.objectContaining({ method: 'PATCH' }));
      expect(store.getActions()).toContain(expectedAction);
    })
  });

  it('creates RECIPE_DELETED when deleting a recipe is successful', () => {
    const expectedAction = { type: actionTypes.RECIPE_DELETED, recipeId: 1 };
    spyOn(window, 'fetch').and.returnValue(successPromise(fixtureRecipes.filter(recipe => recipe.id !== 1)));

    return store.dispatch(actionTypes.makeApiRequest('deleteRecipe', { recipeId: 1 }))
    .then((response) => {
      store.dispatch(actionTypes.recipeDeleted(1));

      expect(window.fetch).toHaveBeenCalled();
      expect(window.fetch).toHaveBeenCalledWith('/api/v1/recipe/1/', jasmine.objectContaining({ method: 'DELETE' }));
      expect(store.getActions()).toContain(expectedAction);
    })
  });

})
