import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

import { Provider } from 'react-redux';
import controlStore from '../../../static/control/js/stores/ControlStore.js';

import RecipeForm from '../../../static/control/js/components/RecipeForm.jsx';
import ConsoleLogForm from '../../../static/control/js/components/action_forms/ConsoleLogForm.jsx';
import HeartbeatForm from '../../../static/control/js/components/action_forms/HeartbeatForm.jsx';

const setup = () => {
  const store = controlStore({
    controlApp: {
      recipes: [{
        "id": 1,
        "name": "Lorem Ipsum",
        "enabled": true,
        "filter_expression": "true",
        "action": "console-log",
        "arguments": { "message": "hello there message here" }
      }],
      isFetching: false,
      selectedRecipe: 1,
      recipeListNeedsFetch: true
    }
  });

  const originalDispatch = store.dispatch;
  const dispatchSpy = jasmine.createSpy('dispatchSpy');

  store.dispatch = (action) => {
    originalDispatch(action);
    dispatchSpy(action);
  }

  const MockProviderComponent = TestUtils.renderIntoDocument(
    <Provider store={store}>
      <RecipeForm dispatch={dispatchSpy}></RecipeForm>
    </Provider>
  );

  const RecipeFormComponent = TestUtils.findRenderedComponentWithType(MockProviderComponent, RecipeForm);
  const selectAction = TestUtils.findRenderedDOMComponentWithTag(RecipeFormComponent, 'select');
  const formElement = TestUtils.findRenderedDOMComponentWithTag(RecipeFormComponent, 'form');

  return { RecipeFormComponent, selectAction, formElement, store };
};


describe('RecipeForm', () => {
  const { RecipeFormComponent, selectAction, formElement, store } = setup();


  describe('rendering', () => {
    it('creates the appropriate components', () => {
      expect(TestUtils.isCompositeComponent(RecipeFormComponent)).toEqual(true);
    });

    it('autopopulates the form fields with the appropriate data', () => {
      const inputFields = TestUtils.scryRenderedDOMComponentsWithTag(RecipeFormComponent, 'input');
      expect(inputFields[0].value).toEqual('Lorem Ipsum');
      expect(inputFields[1].value).toEqual('true');
      expect(inputFields[2].value).toEqual('hello there message here');
    });
  });


  describe('changeAction', () => {
    beforeAll(() => {
      TestUtils.Simulate.change(selectAction, { target: { value: 'show-heartbeat' } });
    });

    it('destroys the current action form and initializes a new one', () => {
      expect(RecipeFormComponent.props.dispatch).toHaveBeenCalledWith({
        type: 'redux-form/DESTROY',
        key: undefined,
        form: 'action'
      });

      expect(RecipeFormComponent.props.dispatch).toHaveBeenCalledWith(jasmine.objectContaining({
        type: 'redux-form/INITIALIZE',
        data: {},
        fields: jasmine.arrayContaining(['surveyId', 'defaults.message', 'surveys[].title']),
        form: 'action'
      }));
    });

    it('registers the change of the `action` field value on the recipe form', () => {
      expect(RecipeFormComponent.props.dispatch).toHaveBeenCalledWith(jasmine.objectContaining({
        type: 'redux-form/CHANGE',
        field: 'action',
        value: 'show-heartbeat',
        form: 'recipe'
      }));

      expect(store.getState().form.recipe.action).toEqual({ initial: 'console-log', value: 'show-heartbeat' });
    });

    it('replaces the previous action form component with the new one', () => {
      expect(TestUtils.scryRenderedComponentsWithType(RecipeFormComponent, HeartbeatForm).length).toEqual(1);
      expect(TestUtils.scryRenderedComponentsWithType(RecipeFormComponent, ConsoleLogForm).length).toEqual(0);
    });
  });


  describe('submitForm', () => {
    beforeAll(() => {
      TestUtils.Simulate.change(selectAction, { target: { value: 'console-log' } });

      const nameField = TestUtils.scryRenderedDOMComponentsWithTag(RecipeFormComponent, 'input')[0];
      const currentActionForm = TestUtils.findRenderedComponentWithType(RecipeFormComponent, ConsoleLogForm);
      const messageField = TestUtils.findRenderedDOMComponentWithTag(currentActionForm, 'input');

      TestUtils.Simulate.change(messageField, { target: { value: 'new message value' } });
      TestUtils.Simulate.change(nameField, { target: { value: 'Dolor Set Amet' } });
      TestUtils.Simulate.submit(formElement);
    });

    it('should start a submit action for the recipe form', () => {
      expect(RecipeFormComponent.props.dispatch).toHaveBeenCalledWith({
        type: 'redux-form/START_SUBMIT',
        form: 'recipe'
      });

      expect(store.getState().form.recipe._submitting).toEqual(true);
    });
  });
});


