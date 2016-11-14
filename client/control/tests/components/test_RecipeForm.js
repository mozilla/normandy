import React from 'react';
import { Provider } from 'react-redux';
import { shallow, mount } from 'enzyme';
import fetchMock from 'fetch-mock';

import { fixtureRecipes, fixtureForm } from '../fixtures.js';

import RecipeForm, { DisconnectedRecipeForm } from '../../components/RecipeForm.js';
import controlStore from '../../stores/ControlStore.js';

describe('<RecipeForm>', () => {
  it('should work unconnected', () => {
    shallow(<DisconnectedRecipeForm
      dispatch={() => {}}
      fields={{}}
      formState={{}}
      recipeId={0}
      submitting={false}
      recipe={{}}
      handleSubmit={() => {}}
      viewingRevision={false}
    />);
  });

  it('should work connected', () => {
    const store = controlStore();
    mount(<Provider store={store}>
      <RecipeForm params={{}} location={{ query: '' }} />
    </Provider>);
  });

  describe('changeAction', () => {
    let store;
    let recipeFormWrapper;
    let disconnectedFormWrapper;

    beforeEach(() => {
      store = controlStore();
      recipeFormWrapper = mount(<Provider store={store}>
        <RecipeForm params={{}} recipe={{ action: 'show-heartbeat' }} location={{ query: '' }} />
      </Provider>);
      disconnectedFormWrapper = recipeFormWrapper.find('DisconnectedRecipeForm').get(0);
      disconnectedFormWrapper.changeAction({ target: { value: 'console-log' } });
    });

    it('should change the action in state & update the form', () => {
      expect(disconnectedFormWrapper.state.selectedAction).toEqual({ name: 'console-log' });
      expect(recipeFormWrapper.find('ConsoleLogForm').length).toEqual(1);
    });
  });

  describe('creating and cloning', () => {
    let store;
    let recipeFormWrapper;


    it('should not display cloning messaging by default', () => {
      store = controlStore();
      recipeFormWrapper = mount(
        <Provider store={store}>
          <RecipeForm params={{}} location={{ query: '' }} />
        </Provider>
      );

      const cloneMessage = recipeFormWrapper.find('.cloning-message');
      // message should not be on the page at all
      expect(cloneMessage.length).toBe(0);
    });

    it('should create a new recipe if cloning', () => {
      // RECIPE_ADDED
      store = controlStore();
      recipeFormWrapper = mount(
        <Provider store={store}>
          <RecipeForm
            recipe={{}}
            params={{
              id: 5,
            }}
            location={{
              query: '',
            }}
            route={{
              isCloning: true,
            }}
            recipeId={5}
          />
        </Provider>
      );

      // mock the 'create' endpoint
      fetchMock
        .mock('/api/v1/recipe/', fixtureRecipes[0])
        .catch(500);

      // stub the data the form would be submitting
      const fakeClone = fixtureForm;

      // directly call the API submission function
      recipeFormWrapper.find('DisconnectedRecipeForm').get(0).submitRecipeToAPI(fakeClone);

      // detect if an API call was actually made
      const calls = fetchMock.calls('/api/v1/recipe/');

      // only one call should be made
      expect(calls.length).toBe(1);
      // and that call should be a POST
      expect(calls[0][1].method).toBe('POST');

      fetchMock.reset();
    });

    it('should display cloning messaging with isCloning enabled', () => {
      recipeFormWrapper = mount(
        <Provider store={store}>
          <RecipeForm params={{}} location={{ query: '' }} route={{ isCloning: true }} />
        </Provider>
      );
      const cloneMessage = recipeFormWrapper.find('.cloning-message');
      // message should be on the page
      expect(cloneMessage.length).toBe(1);
    });

    it('should update a recipe if not cloning', () => {
      store = controlStore();
      recipeFormWrapper = mount(
        <Provider store={store}>
          <RecipeForm
            recipe={{}}
            params={{ id: 5 }}
            location={{ query: '' }}
            route={{ isCloning: false }}
            recipeId={5}
          />
        </Provider>
      );

      // mock the 'update' endpoint
      fetchMock
        .mock('/api/v1/recipe/5/', fixtureRecipes[0])
        .catch(500);

      // stub the data the form would be submitting
      const fakeClone = fixtureForm;

      // directly call the API submission function
      recipeFormWrapper.find('DisconnectedRecipeForm').get(0).submitRecipeToAPI(fakeClone);

      // detect if an API call was actually made
      const calls = fetchMock.calls('/api/v1/recipe/5/');

      // only one call should be made
      expect(calls.length).toBe(1);
      // and that call should be a PATCH
      expect(calls[0][1].method).toBe('PATCH');

      fetchMock.reset();
    });
  });
});
