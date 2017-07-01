/* eslint-disable react/prop-types */
import React from 'react';
import { mount } from 'enzyme';

import { multiStubbedFilters } from 'control/tests/fixtures';
import RecipeCombobox from 'control/components/RecipeCombobox';

const noop = () => {};

const propFactory = props => ({
  onFilterSelect: noop,
  availableFilters: multiStubbedFilters,
  ...props,
});

describe('<RecipeCombobox>', () => {
  it('should work', () => {
    const wrapper = () => mount(<RecipeCombobox {...propFactory()} />);
    expect(wrapper).not.toThrow();
  });

  it('should filter options given text input', () => {
    const wrapper = mount(<RecipeCombobox {...propFactory()} />);

    const searchField = wrapper.find('input[type="text"]');
    searchField.get(0).value = 'test';
    searchField.simulate('change', { target: searchField.get(0) });

    // should only have the 'test' string value as an option
    expect(wrapper.find('.menu-item').length).toBe(1);
    expect(wrapper.find('.group-menu .text').length).toBe(1);
  });

  it('should fire onFilterSelect when user enters text and hits enter', () => {
    let hasFired = false;
    let firedGroup;
    let firedValue;

    const wrapper = mount(<RecipeCombobox
      {...propFactory({
        onFilterSelect: (group, value) => {
          hasFired = true;
          firedGroup = group;
          firedValue = value;
        },
      })}
    />);

    // set the input's value under the hood
    const searchField = wrapper.find('input[type="text"]');
    searchField.get(0).value = 'test';
    // simulate an 'enter'
    searchField.simulate('keyup', {
      keyCode: 13,
      target: searchField.get(0),
    });

    expect(hasFired).toBe(true);
    expect(firedGroup).toBe('text');
    expect(firedValue).toBe('test');
  });

  it('should filter displayed options/groups when searchText is set', () => {
    const wrapper = mount(<RecipeCombobox {...propFactory()} />);
    // focus the input to make the menu pop up
    wrapper.find('input[type="text"]').simulate('focus');

    // no filter = all are shown
    expect(wrapper.find('.menu-item').length).toBe(5);

    // update search text
    const searchField = wrapper.find('input[type="text"]');
    searchField.get(0).value = 'canada';
    searchField.simulate('change', { target: searchField.get(0) });

    // should only display canada, plus the 'text filter' option
    expect(wrapper.find('.menu-item').length).toBe(2);
  });
});
