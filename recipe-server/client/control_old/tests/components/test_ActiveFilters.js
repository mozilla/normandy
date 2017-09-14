/* eslint-disable react/prop-types */
import React from 'react';
import { mount, shallow } from 'enzyme';

import ActiveFilters from 'control_old/components/ActiveFilters';

const noop = () => {};
const propFactory = props => ({
  selectedFilters: [],
  onResetFilters: noop,
  onFilterSelect: noop,
  className: null,
  ...props,
});

const stubbedFilters = [{
  value: 'channels',
  label: 'Channels',
  multiple: true,
  options: [{
    value: 'aurora',
    label: 'Developer Edition',
  }, {
    value: 'beta',
    label: 'Beta',
    selected: true,
  }, {
    value: 'nightly',
    label: 'Nightly',
    selected: true,
  }, {
    value: 'release',
    label: 'Release',
  }],
  selected: true,
}, {
  value: 'status',
  label: 'Status',
  multiple: false,
  options: [{
    value: 'enabled',
    label: 'Enabled',
    selected: true,
  }, {
    value: 'disabled',
    label: 'Disabled',
  }],
  selected: true,
}];

describe('<ActiveFilters>', () => {
  it('should work', () => {
    const wrapper = () => mount(<ActiveFilters {...propFactory()} />);
    expect(wrapper).not.toThrow();
  });

  describe('Filter groups', () => {
    it('should display based on the `selectedFilters` prop', () => {
      const wrapper = mount(<ActiveFilters
        {...propFactory({
          selectedFilters: [],
        })}
      />);
      expect(wrapper.find('.filter-group').length).toBe(0);

      wrapper.setProps({
        selectedFilters: stubbedFilters,
      });

      expect(wrapper.find('.filter-group').length).toBe(2);
    });

    it('should fire the `onFilterSelect` prop when the user clicks an item', () => {
      let hasFired = false;
      let hasData = false;
      const wrapper = mount(<ActiveFilters
        {...propFactory({
          selectedFilters: stubbedFilters,
          onFilterSelect: (group, option) => {
            hasFired = true;
            hasData = !!group && !!option;
          },
        })}
      />);

      wrapper.find('.filter-option').first().simulate('click');
      expect(hasFired).toBe(true);
      expect(hasData).toBe(true);
    });

    it('should append the className prop (if any) to the root element', () => {
      // we have to use shallow to use `hasClass` on the wrapper
      // see: https://github.com/airbnb/enzyme/issues/134
      const wrapper = shallow(<ActiveFilters
        {...propFactory({
          selectedFilters: stubbedFilters,
        })}
      />);

      expect(wrapper.hasClass('active-filters')).toBe(true);

      wrapper.setProps({ className: 'test' });
      // default class should still be on the element
      expect(wrapper.hasClass('active-filters')).toBe(true);
      // and it should also have the `test` class on it
      expect(wrapper.hasClass('test')).toBe(true);

      // update the prop again
      wrapper.setProps({ className: 'test-again' });
      // should still only have one element
      expect(wrapper.hasClass('active-filters')).toBe(true);
      // the old prop should be gone
      expect(wrapper.hasClass('test')).toBe(false);
      // and the new one should be present
      expect(wrapper.hasClass('test-again')).toBe(true);

      // falsy values should not add any class
      wrapper.setProps({ className: false });
      expect(wrapper.hasClass('active-filters')).toBe(true);
      expect(wrapper.hasClass('test')).toBe(false);
      expect(wrapper.hasClass('test-again')).toBe(false);
    });
  });

  describe('Reset button', () => {
    it('should not appear when there no active filters', () => {
      const wrapper = mount(<ActiveFilters
        {...propFactory({
          selectedFilters: [],
        })}
      />);
      expect(wrapper.find('.filter-button.reset').length).toBe(0);
    });

    it('should appear when there active filters', () => {
      const wrapper = mount(<ActiveFilters
        {...propFactory({
          selectedFilters: stubbedFilters,
        })}
      />);
      expect(wrapper.find('.filter-button.reset').length).toBe(1);
    });

    it('should fire the onResetFilters prop on click', () => {
      let hasFired = false;
      const onResetFilters = () => {
        hasFired = true;
      };
      const wrapper = mount(<ActiveFilters
        {...propFactory({
          selectedFilters: stubbedFilters,
          onResetFilters,
        })}
      />);

      wrapper.find('.filter-button.reset').simulate('click');

      expect(hasFired).toBe(true);
    });
  });
});
