import { Icon } from 'antd';
import React from 'react';
import { mount } from 'enzyme';
import { Map } from 'immutable';

import { wrapMockStore } from 'control/tests/mockStore';
import TestComponent from 'control/components/common/EnrollmentStatus';

const { WrappedComponent: EnrollmentStatus } = TestComponent;

describe('<EnrollmentStatus>', () => {
  const props = {
    isEnabled: false,
    isPaused: false,
    record: new Map(),
  };

  it('should work', () => {
    const wrapper = () => mount(wrapMockStore(<EnrollmentStatus {...props} />));
    expect(wrapper).not.toThrow();
  });

  it('should print `disabled` if the recipe is not enabled', () => {
    const wrapper = mount(wrapMockStore(<EnrollmentStatus {...props} isEnabled={false} />));
    expect(wrapper.text()).toContain('Disabled');
    expect(wrapper.find(Icon).props().type).toBe('minus');
  });

  it('should print `active` if the recipe is enabled and NOT paused', () => {
    const wrapper = mount(wrapMockStore(
      <EnrollmentStatus {...props} isEnabled isPaused={false} />
    ));
    expect(wrapper.text()).toContain('Active');
    expect(wrapper.find(Icon).props().type).toBe('check');
  });

  it('should print `paused` if the recipe is enabled and paused', () => {
    const wrapper = mount(wrapMockStore(<EnrollmentStatus {...props} isEnabled isPaused />));
    expect(wrapper.text()).toContain('Paused');
    expect(wrapper.find(Icon).props().type).toBe('pause');
  });
});
