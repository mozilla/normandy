/* eslint-disable react/prop-types */
import React from 'react';
import { shallow } from 'enzyme';

import ConsoleLogFields from 'control_old/components/action_fields/ConsoleLogFields';

describe('<ConsoleLogFields>', () => {
  it('should work', () => {
    const wrapper = () =>
      shallow(<ConsoleLogFields />);

    expect(wrapper).not.toThrow();
  });
});
