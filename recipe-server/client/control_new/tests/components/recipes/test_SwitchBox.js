import React from 'react';
import { shallow } from 'enzyme';

import SwitchBox from 'control_new/components/forms/SwitchBox';

describe('<SwitchBox>', () => {
  const props = {
    children: null,
    onChange: () => {},
    value: null,
  };

  it('should work', () => {
    const wrapper = () => shallow(<SwitchBox {...props} />);

    expect(wrapper).not.toThrow();
  });
});
