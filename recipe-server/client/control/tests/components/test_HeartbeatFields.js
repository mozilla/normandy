/* eslint-disable react/prop-types */
import React from 'react';
import { shallow } from 'enzyme';

import HeartbeatFields from 'control/components/action_fields/HeartbeatFields';

describe('<HeartbeatFields>', () => {
  it('should render when a `fields` prop is given', () => {
    const wrapper = () =>
      shallow(<HeartbeatFields fields={{}} />);

    expect(wrapper).not.toThrow();
  });

  it('should render when a `fields` prop is not given', () => {
    const wrapper = () =>
      shallow(<HeartbeatFields />);

    expect(wrapper).not.toThrow();
  });
});
