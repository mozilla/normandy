/* eslint-disable react/prop-types */
import React from 'react';
import { shallow } from 'enzyme';

import { HeartbeatFields } from 'control_old/components/action_fields/HeartbeatFields';

describe('<HeartbeatFields>', () => {
  it('should render when a `recipeArguments` prop is given', () => {
    const wrapper = () =>
      shallow(<HeartbeatFields recipeArguments={{}} />);

    expect(wrapper).not.toThrow();
  });
});
