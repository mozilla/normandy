import { Map } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import TestComponent from 'control/components/recipes/RecipeDetails';

const { WrappedComponent: RecipeDetails } = TestComponent;

describe('<RecipeDetails>', () => {
  const props = {
    recipe: new Map(),
  };

  it('should work', () => {
    const wrapper = () => shallow(<RecipeDetails {...props} />);

    expect(wrapper).not.toThrow();
  });
});
