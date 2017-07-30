import React from 'react';
import { shallow } from 'enzyme';

import TestComponent from 'control_new/components/recipes/CreateRecipePage';

const { WrappedComponent: CreateRecipePage } = TestComponent;

describe('<CreateRecipePage>', () => {
  const props = {
    createRecipe: () => {},
    push: () => {},
  };

  it('should work', () => {
    const wrapper = () => shallow(<CreateRecipePage {...props} />);

    expect(wrapper).not.toThrow();
  });
});
