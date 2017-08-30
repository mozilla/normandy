import { List } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import TestComponent from 'control_new/components/forms/LocalesField';

const { WrappedComponent: LocalesField } = TestComponent;

describe('<LocalesField>', () => {
  const props = {
    locales: new List(),
  };

  it('should work', () => {
    const wrapper = () => shallow(<LocalesField {...props} />);

    expect(wrapper).not.toThrow();
  });
});
