import React from 'react';
import { shallow } from 'enzyme';
import { Link } from 'redux-little-router';

import EnrollmentStatus from 'control/components/common/EnrollmentStatus';

describe('<EnrollmentStatus>', () => {
  it('should work', () => {
    const wrapper = () => shallow(<EnrollmentStatus recipe={{}} />);
    expect(wrapper).not.toThrow();
  });

  it('should print `disabled` if the recipe is not enabled', () => {
    const recipe = { enabled: false };
    const wrapper = shallow(<EnrollmentStatus recipe={recipe} />);
    expect(wrapper.text()).toContain('Disabled');
    expect(wrapper.find('.status-icon').props().type).toBe('minus');
  });

  it('should print `active` if the recipe is enabled and NOT paused', () => {
    const recipe = { enabled: true, arguments: { isEnrollmentPaused: false } };
    const wrapper = shallow(<EnrollmentStatus recipe={recipe} />);
    expect(wrapper.text()).toContain('Active');
    expect(wrapper.find('.status-icon').props().type).toBe('check');
  });

  it('should print `paused` if the recipe is enabled and paused', () => {
    const recipe = { enabled: true, arguments: { isEnrollmentPaused: true } };
    const wrapper = shallow(<EnrollmentStatus recipe={recipe} />);
    expect(wrapper.text()).toContain('Paused');
    expect(wrapper.find('.status-icon').props().type).toBe('pause');
  });

  it('should add a "lowkey" class when the recipe is disabled', () => {
    const recipe = { enabled: false };
    const wrapper = shallow(<EnrollmentStatus recipe={recipe} />);
    expect(wrapper.find(Link).props().className).toContain('is-lowkey');
  });
});
