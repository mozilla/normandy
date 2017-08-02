import { Map } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import RecipeDetails from 'control_new/components/recipes/RecipeDetails';

describe('<RecipeDetails>', () => {
  const props = {
    recipe: new Map(),
  };

  it('should work', () => {
    const wrapper = () => shallow(<RecipeDetails {...props} />);

    expect(wrapper).not.toThrow();
  });
});
