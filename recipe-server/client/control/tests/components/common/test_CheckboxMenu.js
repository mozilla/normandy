import React from 'react';
import { shallow } from 'enzyme';

import CheckboxMenu from 'control/components/common/CheckboxMenu';

describe('<CheckboxMenu>', () => {
  const props = {
    checkboxes: [],
    label: '',
    onChange: () => {},
    options: [],
  };

  it('should work', () => {
    const wrapper = () =>
      shallow(<CheckboxMenu {...props} />);

    expect(wrapper).not.toThrow();
  });
});
