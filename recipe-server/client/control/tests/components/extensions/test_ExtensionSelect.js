import { Select } from 'antd';
import { mount } from 'enzyme';
import { fromJS, List } from 'immutable';
import React from 'react';

import { wrapMockStore } from 'control/tests/mockStore';
import TestComponent from 'control/components/extensions/ExtensionSelect';

const { WrappedComponent: ExtensionSelect } = TestComponent;

describe('<ExtensionSelect>', () => {
  const props = {
    disabled: false,
    extensions: new List(),
    isLoadingSearch: false,
    onChange: () => {},
    size: 'default',
  };

  it('should work', () => {
    // Need to wrap the components with a mock store in order to mount the nested
    // (but connected) query component.
    const wrapper = () => mount(wrapMockStore(<ExtensionSelect {...props} />));

    expect(wrapper).not.toThrow();
  });

  it('should display the placeholder element appropriately', () => {
    const wrapper = mount(wrapMockStore(<ExtensionSelect {...props} />));

    // Determine if the ant placeholder is present on the page.
    const placeholderElement = wrapper.find('.ant-select-selection__placeholder');
    expect(placeholderElement.length).toBe(1);

    // Determine if the placeholder is actually visible to the user.
    const placeholderStyle = placeholderElement.get(0).style;
    expect(placeholderStyle.display).toBe('block');
  });

  it('should display its inherited value prop', () => {
    const wrapper = mount(wrapMockStore(
      <ExtensionSelect
        {...props}
        extensions={fromJS([{ xpi: '1', name: 'one' }, { xpi: '2', name: 'two' }])}
        value="2"
      />,
    ));

    expect(wrapper.find('.ant-select-selection-selected-value').text()).toBe('two');
  });

  it('should fire an onChange event appropriately', async () => {
    let selected;
    const wrapper = mount(wrapMockStore(
      <ExtensionSelect
        {...props}
        extensions={
          fromJS([{ xpi: '1', name: 'one' }, { xpi: '2', name: 'two' }])
        }
        onChange={val => {
          selected = val;
        }}
      />,
    ));

    const selectEl = wrapper.find(Select);
    expect(selectEl.props().children.size).toBe(2);

    selectEl.props().onChange('2');
    expect(selected).toBe('2');
  });
});
