/* eslint-disable react/prop-types */
import React from 'react';
import { shallow } from 'enzyme';

import {
  PreferenceExperimentFields,
} from 'control/components/action_fields/PreferenceExperimentFields';

describe('<PreferenceExperimentFields>', () => {
  it('should render without errors', () => {
    const wrapper = () => {
      shallow(<PreferenceExperimentFields preferenceBranchType="default" />);
    };

    expect(wrapper).not.toThrow();
  });

  it('should render a warning if using the user preference branch type', () => {
    const wrapper = shallow(<PreferenceExperimentFields preferenceBranchType="user" />);
    const warning = wrapper.find('.field-warning');
    expect(warning.length).toBe(1);
    expect(warning.text()).toContain('not recommended');
  });
});
