/* eslint-disable react/prop-types */
import React from 'react';
import { mount } from 'enzyme';

import RecipeFormActions from 'control/components/RecipeFormActions';

const propFactory = props => ({
  onAction: () => {},
  isUserViewingOutdated: false,
  isViewingLatestApproved: false,
  isPendingApproval: false,
  isUserRequester: false,
  isAlreadySaved: false,
  isFormPristine: false,
  isCloning: false,
  recipeId: 12345,
  ...props,
});

describe('<RecipeFormActions>', () => {
  it('should work', () => {
    const wrapper = () => mount(<RecipeFormActions {...propFactory()} />);
    expect(wrapper).not.toThrow();
  });

  describe('Cancel button', () => {
    const displayCriteria = {
      isUserViewingOutdated: false,
      isPendingApproval: true,
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

    it('should display with proper criteria', () => {
      const wrapper = mount(<RecipeFormActions {...propFactory(displayCriteria)} />);
      expect(wrapper.find('.action-cancel').length).toBe(1);
    });
  });

  describe('Approve + Reject Buttons', () => {
    const displayCriteria = {
      isUserViewingOutdated: false,
      isPendingApproval: true,
      isCloning: false,
    };

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

    it('should NOT be enabled when user is the approval requester', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isUserRequester: true,
        })}
      />);
      expect(wrapper.find('.action-approve').prop('disabled')).toBe(true);
      expect(wrapper.find('.action-reject').prop('disabled')).toBe(true);
    });

    it('should display with proper criteria', () => {
      const wrapper = mount(<RecipeFormActions {...propFactory(displayCriteria)} />);
      expect(wrapper.find('.action-approve').length).toBe(1);
      expect(wrapper.find('.action-reject').length).toBe(1);
    });
  });


  describe('Delete button', () => {
    const displayCriteria = {
      isAlreadySaved: true,
      isCloning: false,
    };

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

    it('should NOT display when there is an approval request, at all', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          hasApprovalRequest: true,
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

    it('should NOT be enabled if user has edited the recipe form', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isFormPristine: false,
        })}
      />);
      expect(wrapper.find('.action-request').props().disabled).toBe(true);
    });

    it('should display with proper criteria', () => {
      const wrapper = mount(<RecipeFormActions {...propFactory(displayCriteria)} />);
      expect(wrapper.find('.action-request').length).toBe(1);
    });
  });

  describe('Save Draft button', () => {
    const displayCriteria = {
      isAlreadySaved: true,
      isCloning: false,
    };

    it('should NOT display if the recipe is brand new and has not been saved yet', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isAlreadySaved: false,
        })}
      />);
      expect(wrapper.find('.action-save').length).toBe(0);
    });

    it('should not display when user is cloning a recipe', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isCloning: true,
        })}
      />);
      expect(wrapper.find('.action-save').length).toBe(0);
    });

    it('should NOT be enabled if user has NOT edited the recipe form', () => {
      let wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isFormPristine: true,
        })}
      />);
      expect(wrapper.find('.action-save').props().disabled).toBe(true);

      wrapper = mount(<RecipeFormActions
        {...propFactory({
          ...displayCriteria,
          isFormPristine: false,
        })}
      />);
      expect(wrapper.find('.action-save').props().disabled).toBe(false);
    });

    it('should display with proper criteria', () => {
      const wrapper = mount(<RecipeFormActions {...propFactory(displayCriteria)} />);
      expect(wrapper.find('.action-save').length).toBe(1);
    });
  });

  describe('New Recipe button', () => {
    const displayCriteria = {
      isAlreadySaved: false,
      isCloning: true,
    };

    it('should NOT display when user is NOT cloning a recipe', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          isAlreadySaved: true,
          isCloning: false,
        })}
      />);
      expect(wrapper.find('.action-new').length).toBe(0);
    });

    it('should NOT display if the recipe already exists in the DB', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          isAlreadySaved: true,
          isCloning: false,
        })}
      />);
      expect(wrapper.find('.action-new').length).toBe(0);
    });

    it('should display if display criteria is met', () => {
      const wrapper = mount(<RecipeFormActions {...propFactory(displayCriteria)} />);
      expect(wrapper.find('.action-new').length).toBe(1);
    });
  });

  describe('Enable button', () => {
    const displayCriteria = {
      isViewingLatestApproved: true,
    };

    it('should NOT display when user is NOT viewing the latest approved revision', () => {
      const wrapper = mount(<RecipeFormActions
        {...propFactory({
          isViewingLatestApproved: false,
        })}
      />);
      expect(wrapper.find('.action-enable').length).toBe(0);
    });

    it('should display if display criteria is met', () => {
      const wrapper = mount(<RecipeFormActions {...propFactory(displayCriteria)} />);
      expect(wrapper.find('.action-enable').length).toBe(1);
    });
  });
});
