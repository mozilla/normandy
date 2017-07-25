import { fromJS } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import BooleanIcon from 'control_new/components/common/BooleanIcon';

describe('<BooleanIcon>', () => {
  it('should work when true', () => {
    const wrapper = () =>
      shallow(<BooleanIcon value={true} />);

    expect(wrapper).not.toThrow();
  });

  it('should work when false', () => {
    const wrapper = () =>
      shallow(<BooleanIcon value={false} />);

    expect(wrapper).not.toThrow();
  });
});
