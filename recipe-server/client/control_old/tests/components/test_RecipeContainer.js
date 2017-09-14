/* eslint-disable react/prop-types */
import React from 'react';
import { shallow } from 'enzyme';

import { RecipeContainer } from 'control_old/components/RecipeContainer';

/**
 * Creates mock required props for RecipeContainer.
 */
function propFactory(props = {}) {
  return {
    dispatch: () => Promise.resolve(),
    recipe: {},
    routeParams: {},
    ...props,
  };
}

describe('<RecipeContainer>', () => {
  it('should not throw when instantiating', () => {
    const wrapper = () => { shallow(<RecipeContainer {...propFactory()} />); };
    expect(wrapper).not.toThrow();
  });
});
