/* eslint-disable react/prop-types */
import React from 'react';
import { mount } from 'enzyme';

import RecipeFormActions from 'control/components/RecipeFormActions';

const propFactory = props => ({
  onAction: () => {},
  isUserViewingOutdated: false,
  isPendingApproval: false,
  isUserRequestor: false,
  isAlreadySaved: false,
  isFormPristine: false,
  isCloning: false,
  isFormDisabled: false,
  recipeId: 12345,
  ...props,
});

describe('<RecipeFormActions>', () => {
  it('should work', () => {
    const wrapper = () => mount(<RecipeFormActions {...propFactory()} />);
    expect(wrapper).not.toThrow();
  });


  describe('Revert button', () => {
    const displayCriteria = {
      isUserViewingOutdated: true,
      isFormPristine: true,
    };

    it('should NOT display when user is viewing a current revision', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isUserViewingOutdated: false,
        })}
      />);
      expect(wrapper.find('.action-revert').length).toBe(0);
    });

    it('should NOT display when user is viewing an outdated revision with changes', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isUserViewingOutdated: true,
          isFormPristine: false,
        })}
      />);
      expect(wrapper.find('.action-revert').length).toBe(0);
    });

    it('should display when user is viewing an outdated, pristine revision', () => {
      const wrapper = mount(<RecipeFormActions {...propFactory(displayCriteria)} />);
      expect(wrapper.find('.action-revert').length).toBe(1);
    });
  });


  describe('Cancel button', () => {
    const displayCriteria = {
      isUserViewingOutdated: false,
      isPendingApproval: true,
      isUserRequestor: true,
    };

    it('should fire a `cancel` action', () => {
      let firedType;
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          onAction: type => { firedType = type; },
        })}
      />);
      wrapper.find('.action-cancel').simulate('click');
      expect(firedType).toBe('cancel');
    });

    it('should NOT display when viewing outdated revision', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isUserViewingOutdated: true,
        })}
      />);
      expect(wrapper.find('.action-cancel').length).toBe(0);
    });

    it('should NOT display when no approval request exists', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isPendingApproval: false,
        })}
      />);
      expect(wrapper.find('.action-cancel').length).toBe(0);
    });

    it('should NOT display if user is not the approval requestor', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isUserRequestor: false,
        })}
      />);
      expect(wrapper.find('.action-cancel').length).toBe(0);
    });

    it('should display with proper criteria', () => {
      const wrapper = mount(<RecipeFormActions {...propFactory(displayCriteria)} />);
      expect(wrapper.find('.action-cancel').length).toBe(1);
    });
  });


  describe('Back to Latest/Review button', () => {
    const displayCriteria = {
      isUserViewingOutdated: true,
      isCloning: false,
    };

    it('should NOT display when viewing the current revision', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isUserViewingOutdated: false,
        })}
      />);
      expect(wrapper.find('.action-back').length).toBe(0);
    });

    it('should NOT display when user is cloning a recipe', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isCloning: true,
        })}
      />);
      expect(wrapper.find('.action-back').length).toBe(0);
    });

    it('should display when viewing an outdated revision and NOT cloning', () => {
      const wrapper = mount(<RecipeFormActions {...propFactory(displayCriteria)} />);
      expect(wrapper.find('.action-back').length).toBe(1);
    });

    it('should read `Back to Latest` if no approval request is open', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isPendingApproval: false,
        })}
      />);
      expect(wrapper.find('.action-back').text()).toBe('Back to Latest');
    });

    it('should read `Back to Review` if an approval request is open', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isPendingApproval: true,
        })}
      />);
      expect(wrapper.find('.action-back').text()).toBe('Back to Review');
    });
  });


  describe('Approve + Reject Buttons', () => {
    const displayCriteria = {
      isUserViewingOutdated: false,
      isPendingApproval: true,
      isCloning: false,
      isUserRequestor: false,
    };

    it('should fire an `approve` action', () => {
      let firedType;
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          onAction: type => { firedType = type; },
        })}
      />);
      wrapper.find('.action-approve').simulate('click');
      expect(firedType).toBe('approve');
    });

    it('should fire a `reject` action', () => {
      let firedType;
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          onAction: type => { firedType = type; },
        })}
      />);
      wrapper.find('.action-reject').simulate('click');
      expect(firedType).toBe('reject');
    });

    it('should NOT display when viewing an outdated revision', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isUserViewingOutdated: true,
        })}
      />);
      expect(wrapper.find('.action-approve').length).toBe(0);
      expect(wrapper.find('.action-reject').length).toBe(0);
    });

    it('should NOT display when there is no approval request open', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isPendingApproval: false,
        })}
      />);
      expect(wrapper.find('.action-approve').length).toBe(0);
      expect(wrapper.find('.action-reject').length).toBe(0);
    });

    it('should NOT display when user is cloning a recipe', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isCloning: true,
        })}
      />);
      expect(wrapper.find('.action-approve').length).toBe(0);
      expect(wrapper.find('.action-reject').length).toBe(0);
    });

    it('should NOT display when user is the approval requestor', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isUserRequestor: true,
        })}
      />);
      expect(wrapper.find('.action-approve').length).toBe(0);
      expect(wrapper.find('.action-reject').length).toBe(0);
    });

    it('should display with proper criteria', () => {
      const wrapper = mount(<RecipeFormActions {...propFactory(displayCriteria)} />);
      expect(wrapper.find('.action-approve').length).toBe(1);
      expect(wrapper.find('.action-reject').length).toBe(1);
    });
  });


  describe('Delete button', () => {
    const displayCriteria = {
      isUserViewingOutdated: false,
      isPendingApproval: false,
      isAlreadySaved: true,
      isCloning: false,
    };

    it('should NOT display when viewing an outdated revision', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isUserViewingOutdated: true,
        })}
      />);
      expect(wrapper.find('.action-delete').length).toBe(0);
    });

    it('should NOT display when there is an approval request open', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isPendingApproval: true,
        })}
      />);
      expect(wrapper.find('.action-delete').length).toBe(0);
    });

    it('should NOT display if the recipe is brand new and has not been saved yet', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isAlreadySaved: false,
        })}
      />);
      expect(wrapper.find('.action-delete').length).toBe(0);
    });

    it('should NOT display when user is cloning a recipe', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isCloning: true,
        })}
      />);
      expect(wrapper.find('.action-delete').length).toBe(0);
    });

    it('should display with proper criteria', () => {
      const wrapper = mount(<RecipeFormActions {...propFactory(displayCriteria)} />);
      expect(wrapper.find('.action-delete').length).toBe(1);
    });
  });

  describe('Request Approval button', () => {
    const displayCriteria = {
      isUserViewingOutdated: false,
      isPendingApproval: false,
      isAlreadySaved: true,
      isCloning: false,
      isFormPristine: true,
    };

    it('should fire a `request` action', () => {
      let firedType;
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          onAction: type => { firedType = type; },
        })}
      />);
      wrapper.find('.action-request').simulate('click');
      expect(firedType).toBe('request');
    });

    it('should NOT display when viewing an outdated revision', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isUserViewingOutdated: true,
        })}
      />);
      expect(wrapper.find('.action-request').length).toBe(0);
    });

    it('should NOT display when there is an approval request open', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isPendingApproval: true,
        })}
      />);
      expect(wrapper.find('.action-request').length).toBe(0);
    });

    it('should NOT display if the recipe is brand new and has not been saved yet', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isAlreadySaved: false,
        })}
      />);
      expect(wrapper.find('.action-request').length).toBe(0);
    });

    it('should NOT display when user is cloning a recipe', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isCloning: true,
        })}
      />);
      expect(wrapper.find('.action-request').length).toBe(0);
    });

    it('should NOT display if user has edited the recipe form', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isFormPristine: false,
        })}
      />);
      expect(wrapper.find('.action-request').length).toBe(0);
    });

    it('should display with proper criteria', () => {
      const wrapper = mount(<RecipeFormActions {...propFactory(displayCriteria)} />);
      expect(wrapper.find('.action-request').length).toBe(1);
    });
  });

  describe('Save Draft button', () => {
    const displayCriteria = {
      isUserViewingOutdated: false,
      isPendingApproval: false,
      isAlreadySaved: true,
      isCloning: false,
      isFormPristine: false,
    };

    it('should NOT display when viewing an outdated revision', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isUserViewingOutdated: true,
        })}
      />);
      expect(wrapper.find('.action-save').length).toBe(0);
    });

    it('should NOT display when there is an approval request open', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isPendingApproval: true,
        })}
      />);
      expect(wrapper.find('.action-save').length).toBe(0);
    });

    it('should NOT display if the recipe is brand new and has not been saved yet', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isAlreadySaved: false,
        })}
      />);
      expect(wrapper.find('.action-save').length).toBe(0);
    });

    it('should NOT display when user is cloning a recipe', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isCloning: true,
        })}
      />);
      expect(wrapper.find('.action-save').length).toBe(0);
    });

    it('should NOT display if user has NOT edited the recipe form', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isFormPristine: true,
        })}
      />);
      expect(wrapper.find('.action-save').length).toBe(0);
    });

    it('should display with proper criteria', () => {
      const wrapper = mount(<RecipeFormActions {...propFactory(displayCriteria)} />);
      expect(wrapper.find('.action-save').length).toBe(1);
    });
  });

  describe('New Recipe button', () => {
    const displayCriteria = {
      isCloning: false,
      isPendingApproval: false,
      isAlreadySaved: false,
      // include the negation of the second criteria to prevent accidental passes
      isUserViewingOutdated: false,
      isFormPristine: true,
    };
    // - or -
    const otherDisplayCriteria = {
      isUserViewingOutdated: true,
      isFormPristine: false,
      // include the negation of the first criteria to prevent accidental passes
      isCloning: true,
      isPendingApproval: true,
      isAlreadySaved: true,
    };

    it('should NOT display when user is cloning a recipe', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isCloning: true,
        })}
      />);
      expect(wrapper.find('.action-new').length).toBe(0);
    });

    it('should NOT display when there is an approval request open', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isPendingApproval: true,
        })}
      />);
      expect(wrapper.find('.action-new').length).toBe(0);
    });

    it('should NOT display if the recipe already exists in the DB', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isAlreadySaved: true,
        })}
      />);
      expect(wrapper.find('.action-new').length).toBe(0);
    });

    // other criteria
    it('should NOT display when user is viewing a current revision', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...otherDisplayCriteria,
          isUserViewingOutdated: false,
        })}
      />);
      expect(wrapper.find('.action-new').length).toBe(0);
    });

    it('should NOT display when user has not edited the form', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...otherDisplayCriteria,
          isFormPristine: true,
        })}
      />);
      expect(wrapper.find('.action-new').length).toBe(0);
    });

    it('should display if either display criteria is met', () => {
      let wrapper = mount(<RecipeFormActions {...propFactory(displayCriteria)} />);
      expect(wrapper.find('.action-new').length).toBe(1);

      wrapper = mount(<RecipeFormActions {...propFactory(otherDisplayCriteria)} />);
      expect(wrapper.find('.action-new').length).toBe(1);
    });
  });
});
