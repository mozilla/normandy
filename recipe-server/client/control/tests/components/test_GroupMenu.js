/* eslint-disable react/prop-types */
import React from 'react';
import { mount } from 'enzyme';

import GroupMenu from 'control/components/GroupMenu';

const noop = () => {};
const stubbedGroup = {
  value: 'channels',
  label: 'Channels',
  multiple: true,
  options: [{
    value: 'aurora',
    label: 'Developer Edition',
  }, {
    value: 'beta',
    label: 'Beta',
  }, {
    value: 'release',
    label: 'Release',
  }],
};

const stubbedData = [{
  ...stubbedGroup,
}, {
  value: 'countries',
  label: 'Countries',
  multiple: true,
  options: [{
    value: 'AF',
    label: 'Afghanistan',
  }, {
    value: 'AL',
    label: 'Albania',
  }, {
    value: 'DZ',
    label: 'Algeria',
  }, {
    value: 'XL',
    label: 'Xlbania',
  }, {
    value: 'XZ',
    label: 'Xlgeria',
  }, {
    value: 'XY',
    label: 'XYeria',
  }, {
    value: 'XX',
    label: 'XXeria',
  }],
}];

const propFactory = props => ({
  data: [],
  onItemSelect: noop,
  searchText: null,
  ...props,
});

describe('<GroupMenu>', () => {
  it('should work', () => {
    const wrapper = () => mount(<GroupMenu {...propFactory()} />);
    expect(wrapper).not.toThrow();
  });

  it('should display a list of given groups', () => {
    const wrapper = mount(<GroupMenu
      {...propFactory({
        data: stubbedData,
      })}
    />,
    );

    expect(wrapper.find('.group-label').length).toBe(2);
    // we have two separate groups
    expect(wrapper.find('.group-label.channels').length).toBe(1);
    expect(wrapper.find('.group-label.countries').length).toBe(1);

    // 5 max countries + 3 channels = 8 max displayed menu items
    expect(wrapper.find('.menu-item').length).toBe(8);
  });

  describe('onItemSelect', () => {
    it('should fire with group/option data when an item is clicked', () => {
      let hasFired = false;
      let firedGroup;
      let firedOption;

      const onSelectTest = (group, option) => {
        hasFired = true;
        firedGroup = group;
        firedOption = option;
      };

      const wrapper = mount(
        <GroupMenu
          {...propFactory({
            data: [stubbedGroup],
            onItemSelect: onSelectTest,
          })}
        />,
      );

      wrapper.find('.menu-item').at(0).simulate('click');
      expect(hasFired).toBe(true);
      expect(firedGroup).toBe(stubbedGroup);
      expect(firedOption).toBe(stubbedGroup.options[0]);

      // click the next item to make sure that fires appropriately
      wrapper.find('.menu-item').at(1).simulate('click');
      expect(hasFired).toBe(true);
      expect(firedGroup).toBe(stubbedGroup);
      expect(firedOption).toBe(stubbedGroup.options[1]);
    });
  });

  describe('Groups with many options', () => {
    it('should truncate groups with more than 5 options', () => {
      const wrapper = mount(
        <GroupMenu
          {...propFactory({
            data: stubbedData,
          })}
        />,
      );

      expect(wrapper.find('.view-more').length).toBe(1);
    });

    it('should NOT truncate the displayed options if searchText is set', () => {
      const wrapper = mount(
        <GroupMenu
          {...propFactory({
            data: stubbedData,
          })}
        />,
      );

      // no text filter = cap limit at 5
      expect(wrapper.find('.group-menu .countries').find('.menu-item').length).toBe(5);

      wrapper.setProps({ searchText: 'ia' });
      // one group should display all options now
      expect(wrapper.find('.group-menu .countries').find('.menu-item').length).toBe(7);
    });

    it('should show the entire list if `View more` is clicked', () => {
      const wrapper = mount(
        <GroupMenu
          {...propFactory({
            data: stubbedData,
          })}
        />,
      );

      expect(wrapper.find('.menu-item').length).toBe(8);
      wrapper.find('.view-more').simulate('click');
      expect(wrapper.find('.menu-item').length).toBe(10);
    });
  });

  it('should add a `Text Filter` option when searchText is set', () => {
    const wrapper = mount(
      <GroupMenu
        {...propFactory({
          data: [stubbedGroup],
        })}
      />,
    );


    // not shown to start
    expect(wrapper.find('.group-menu .text').length).toBe(0);

    wrapper.setProps({ searchText: 'test' });
    // text group menu should exist
    expect(wrapper.find('.group-menu .text').length).toBe(1);
    // first menu item should be the text option
    expect(wrapper
        .find('.group-menu .text')
        .find('.menu-item')
        .first().text(),
      ).toBe('test');
  });
});
