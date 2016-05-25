import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import { RecipeForm } from '../../static/control/js/components/RecipeForm.jsx';
import { _ } from 'underscore';

const setup = (componentProps) => {
  let props = {
    fields: {'name': {}, 'filter_expression': {}, 'enabled': {}, 'action_name': {}},
    recipe: { "id": 1, "name": "Lorem Ipsum", "enabled": true, "filter_expression": "()", "action_name": "console-log" },
    handleSubmit: fn => fn,
    ...componentProps
  }

  const renderer = TestUtils.createRenderer();
  renderer.render(<RecipeForm {...props} />);
  const output = renderer.getRenderOutput();

  return {
    props,
    output,
    renderer
  }
};

describe('recipe Form', () => {
  const { output, renderer, props } = setup();

  describe('render', () => {

    it('should render the form', () => {
      expect(output.type).toEqual('form')
      expect(output.props.className).toEqual('crud-form');
    });

    it('should not show a notification if viewing the current recipe version', () => {
      let children = _.filter(output.props.children, (child => typeof child === 'object'));
      let notificationElement = children.find(child => child.props.id === 'viewing-revision');
      expect(notificationElement).toBeUndefined();
    });

    it('should show a notification if viewing a revision of a recipe', () => {
      const { output } = setup({ viewingRevision: true });
      let notificationElement = output.props.children.find(child => child.props.id === 'viewing-revision');
      expect(notificationElement).not.toBeUndefined();
    });

  });

  describe('changeAction', () => {

    it('should destroy the current child ActionForm', () => {

    });

    it('should trigger an onChange event to update the select menu value', () => {

    });

    it('should set the selectedAction to the current value of the select menu', () => {

    });

  });

  describe('submitForm', () => {

    it('should combine recipe & action form values for submission', () => {

    });

    it('should dispatch an updateRecipe action if editing an existing recipe', () => {

    });

    it('should dispatch an addRecipe action if creating a new recipe', () => {

    });

  });
});
