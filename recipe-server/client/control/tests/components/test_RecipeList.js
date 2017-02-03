/* eslint-disable react/prop-types */
import React from 'react';
import { shallow } from 'enzyme';
import appReducer from 'control/reducers';
import * as actions from 'control/actions/RecipeActions';
import { initialState } from 'control/tests/fixtures';

import { Tr } from 'reactable';
import { DisconnectedRecipeList as RecipeList } from 'control/components/RecipeList';

const propFactory = props => ({
  dispatch: () => {},
  isFetching: false,
  recipeListNeedsFetch: false,
  recipes: [],
  displayedColumns: [],
  ...props,
});

const fakeRecipe = {
  id: 3,
  name: 'Villis stebulum',
  enabled: false,
};

describe('<RecipeList>', () => {
  it('should work', () => {
    const wrapper = () => shallow(<RecipeList {...propFactory()} />);
    expect(wrapper).not.toThrow();
  });

  it('should only have one recipe in list after creating + updating a recipe', () => {
    const store = appReducer(initialState, {
      type: actions.RECIPE_ADDED,
      recipe: fakeRecipe,
    }, {
      type: actions.RECIPE_UPDATED,
      recipe: {
        id: 3,
        name: 'Updated recipe name',
        enabled: true,
      },
    });

    const wrapper = shallow(
      <RecipeList {...propFactory({ recipes: store.recipes })} />
    );

    expect(wrapper.find(Tr).length).toBe(1);
  });
});
