import { Map } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import TestComponent from 'control_new/components/recipes/RecipeListing';

const { WrappedComponent: RecipeListing } = TestComponent;

describe('<RecipeListing>', () => {
  const props = {
    revision: new Map(),
    status: null,
  };

  it('should work', () => {
    const wrapper = () => shallow(<RecipeListing {...props} />);

    expect(wrapper).not.toThrow();
  });
});
