/* eslint-disable react/prop-types */
import React from 'react';
import { shallow } from 'enzyme';

import { RolloutFields } from 'control/components/action_fields/RolloutFields';

describe('<RolloutFields>', () => {
  it('should render when a `recipeArguments` prop is given', () => {
    const wrapper = () => shallow(<RolloutFields recipeArguments={{}} />);
    expect(wrapper).not.toThrow();
  });

  it('should not display a warning message when given a non-"user" preference branch', () => {
    const wrapper = shallow(<RolloutFields recipeArguments={{ preferenceBranch: 'default' }} />);
    expect(wrapper.find('.user-branch-warning').length).toBe(0);
  });

  it('should display a warning message when given a `user` preference branch', () => {
    const wrapper = shallow(<RolloutFields recipeArguments={{ preferenceBranch: 'user' }} />);
    expect(wrapper.find('.user-branch-warning').length).toBe(1);
  });
});
