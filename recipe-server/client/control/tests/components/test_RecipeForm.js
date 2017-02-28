/* eslint-disable react/prop-types */
import React from 'react';
import { shallow } from 'enzyme';
import { SubmissionError } from 'redux-form';

import { RecipeForm, formConfig, initialValuesWrapper } from 'control/components/RecipeForm.js';
import ConsoleLogFields from 'control/components/action_fields/ConsoleLogFields.js';
import { recipeFactory } from '../../../tests/utils.js';

/**
 * Creates mock required props for RecipeForm.
 */
function propFactory(props = {}) {
  return {
    handleSubmit: () => undefined,
    dispatch: () => Promise.resolve(),
    submitting: false,
    user: {},
    ...props,
  };
}

describe('<RecipeForm>', () => {
  it("should show a loading indicator if the recipe hasn't loaded yet", () => {
    const wrapper = shallow(<RecipeForm recipeId={1} {...propFactory()} />);
    expect(wrapper.hasClass('recipe-form loading')).toBe(true);
  });

  it('should render the fields for the specified action', () => {
    const wrapper = shallow(
      <RecipeForm selectedAction="console-log" {...propFactory()} />
    );
    expect(wrapper.find(ConsoleLogFields).length).toBe(1);
  });

  it('should render a clone message if user is cloning', () => {
    const recipe = recipeFactory();
    const wrapper = shallow(
      <RecipeForm
        recipeId={recipe.id}
        recipe={recipe}
        {...propFactory()}
        route={{ isCloning: true }}
      />
    );
    // message should exist
    expect(wrapper.find('.cloning-message').length).toBe(1);
  });

  describe('asyncValidate', () => {
    it('should throw if the filter expression is blank', async () => {
      try {
        await formConfig.asyncValidate({ filter_expression: '' });
        expect(false).toBe(true); // Fail if we don't throw.
      } catch (err) {
        expect('filter_expression' in err).toBe(true);
      }
    });

    it('should throw if the filter expression is invalid JEXL', async () => {
      try {
        await formConfig.asyncValidate({ filter_expression: '2-- + 4 (' });
        expect(false).toBe(true); // Fail if we don't throw.
      } catch (err) {
        expect('filter_expression' in err).toBe(true);
      }
    });

    it('should pass if the filter expression is valid JEXL', async () => {
      // Should not throw.
      await formConfig.asyncValidate({ filter_expression: '1+1' });
    });
  });

  describe('onSubmit', () => {
    let updateRecipe = null;
    let addRecipe = null;
    beforeEach(() => {
      updateRecipe = jasmine.createSpy('updateRecipe');
      addRecipe = jasmine.createSpy('addRecipe');
    });

    it('should update the recipe if it already has an ID', async () => {
      const recipe = recipeFactory();
      updateRecipe.and.returnValue(Promise.resolve());

      await formConfig.onSubmit(recipe, () => {}, {
        recipeId: recipe.id,
        updateRecipe,
        addRecipe,
      });

      expect(updateRecipe).toHaveBeenCalledWith(recipe.id, {
        name: recipe.name,
        enabled: recipe.enabled,
        filter_expression: recipe.filter_expression,
        action: recipe.action,
        arguments: recipe.arguments,
      });
      expect(addRecipe).not.toHaveBeenCalled();
    });

    it("should add a new recipe if it doesn't have an ID", async () => {
      const recipe = recipeFactory();
      addRecipe.and.returnValue(Promise.resolve());

      await formConfig.onSubmit(recipe, () => {}, {
        recipeId: null,
        updateRecipe,
        addRecipe,
      });

      expect(addRecipe).toHaveBeenCalledWith({
        name: recipe.name,
        enabled: recipe.enabled,
        filter_expression: recipe.filter_expression,
        action: recipe.action,
        arguments: recipe.arguments,
      });
      expect(updateRecipe).not.toHaveBeenCalled();
    });

    it('should create a new recipe when cloning an existing one', async () => {
      const recipe = recipeFactory();
      addRecipe.and.returnValue(Promise.resolve());

      await formConfig.onSubmit(recipe, () => {}, {
        route: { isCloning: true },
        recipeId: null,
        updateRecipe,
        addRecipe,
      });

      expect(addRecipe).toHaveBeenCalledWith({
        name: recipe.name,
        enabled: recipe.enabled,
        filter_expression: recipe.filter_expression,
        action: recipe.action,
        arguments: recipe.arguments,
      });
      expect(updateRecipe).not.toHaveBeenCalled();
    });

    it('should wrap raised errors as SubmissionErrors', async () => {
      const recipe = recipeFactory();
      addRecipe.and.returnValue(Promise.reject('someerror'));

      try {
        await formConfig.onSubmit(recipe, () => {}, {
          recipeId: null,
          updateRecipe,
          addRecipe,
        });
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toEqual(jasmine.any(SubmissionError));
      }
    });
  });

  describe('initialValuesWrapper', () => {
    it('should pass the recipe prop as initialValues to the child component', () => {
      const Component = ({ initialValues }) => <div>{initialValues}</div>;
      const WrappedComponent = initialValuesWrapper(Component);
      const wrapper = shallow(
        <WrappedComponent recipe="fakerecipe" location={{}} />
      );

      expect(wrapper.find(Component).prop('initialValues')).toBe('fakerecipe');
    });

    it('should pass the selected revision as initialValues when available', () => {
      const Component = ({ initialValues }) => <div>{initialValues}</div>;
      const WrappedComponent = initialValuesWrapper(Component);
      const location = { state: { selectedRevision: 'fakerevision' } };
      const wrapper = shallow(
        <WrappedComponent recipe="fakerecipe" location={location} />
      );

      expect(wrapper.find(Component).prop('initialValues')).toBe('fakerevision');
    });
  });
});
