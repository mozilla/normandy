/* eslint-disable react/prop-types */
import React from 'react';
import { shallow } from 'enzyme';

import ConsoleLogFields from 'control/components/action_fields/ConsoleLogFields';

describe('<ConsoleLogFields>', () => {
  it('should work', () => {
    const wrapper = () =>
      shallow(<ConsoleLogFields />);

    expect(wrapper).not.toThrow();
  });
});
