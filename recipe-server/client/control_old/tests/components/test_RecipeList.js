/* eslint-disable react/prop-types */
import React from 'react';
import { shallow } from 'enzyme';
import { Tr } from 'reactable';

import appReducer from 'control_old/reducers';
import * as actions from 'control_old/actions/RecipeActions';
import { initialState } from 'control_old/tests/fixtures';
import { DisconnectedRecipeList as RecipeList } from 'control_old/components/RecipeList';

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
      <RecipeList {...propFactory({ recipes: store.recipes })} />,
    );

    expect(wrapper.find(Tr).length).toBe(1);
  });

  describe('renderTableCell', () => {
    it('should not throw if the recipe attribute being displayed is null', () => {
      const recipeList = shallow(<RecipeList {...propFactory()} />).instance();

      const recipe = { foo: null };
      const wrapper = () => shallow(recipeList.renderTableCell(recipe)({ slug: 'foo' }));
      expect(wrapper).not.toThrow();
    });
  });
});
