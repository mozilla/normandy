import { List, Map } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import TestComponent from 'control/components/recipes/RecipeDetailPage';

const { WrappedComponent: RecipeDetailPage } = TestComponent;

describe('<RecipeDetailPage>', () => {
  const props = {
    history: new List(),
    recipeId: 123,
    revision: new Map(),
    revisionId: 'abc',
  };

  it('should work', () => {
    const wrapper = () => shallow(<RecipeDetailPage {...props} />);

    expect(wrapper).not.toThrow();
  });
});
