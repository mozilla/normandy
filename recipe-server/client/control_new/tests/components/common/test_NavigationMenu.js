import { fromJS } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import TestComponent from 'control_new/components/common/NavigationMenu';
const { WrappedComponent as NavigationMenu } = TestComponent;

describe('<NavigationMenu>', () => {
  const props = {
    router: {},
  };

  it('should work', () => {
    const wrapper = () =>
      shallow(<NavigationMenu {...props} />);

    expect(wrapper).not.toThrow();
  });
});
