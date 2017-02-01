/* eslint-disable react/prop-types */
import React from 'react';
import { shallow } from 'enzyme';
import { multiStubbedFilters } from 'control/tests/fixtures';

import { RecipeFilters } from 'control/components/RecipeFilters';

const noop = () => {};
const propFactory = props => ({
  selectedFilters: [],
  availableFilters: multiStubbedFilters,
  columns: [],
  loadLocalColumns: noop,
  loadFilters: noop,
  selectFilter: noop,
  resetFilters: noop,
  loadFilteredRecipes: noop,
  ...props,
});

describe('<RecipeFilters>', () => {
  it('should work', () => {
    const wrapper = () => shallow(<RecipeFilters {...propFactory()} />);
    expect(wrapper).not.toThrow();
  });
});
