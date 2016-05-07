import controlAppReducer from '../../static/control/js/reducers/ControlAppReducer';
import * as actions from '../../static/control/js/actions/ControlActions';

const initialState = {
  recipes: null,
  isFetching: false,
  selectedRecipe: null,
  recipeListNeedsFetch: true
};

const fixtureRecipes = [
  { "id": 1, "name": "Lorem Ipsum", "enabled": true },
  { "id": 2, "name": "Dolor set amet", "enabled": true },
  { "id": 3, "name": "Consequitar adipscing", "enabled": false }
];

describe('controlApp reducer', () => {
  it('should return initial state by default', () => {
    expect(controlAppReducer(undefined, {})).toEqual(initialState);
  })

  it('should handle REQUEST_IN_PROGRESS', () => {
    expect(controlAppReducer(undefined, {
      type: actions.REQUEST_IN_PROGRESS
    })).toEqual({
      ...initialState,
      isFetching: true
    })
  })

  it('should handle REQUEST_COMPLETE', () => {
    expect(controlAppReducer(undefined, {
      type: actions.REQUEST_COMPLETE,
    })).toEqual({
      ...initialState,
      isFetching: false
    })
  })

  it('should handle RECIPES_RECEIVED', () => {
    expect(controlAppReducer(undefined, {
      type: actions.RECIPES_RECEIVED,
      recipes: fixtureRecipes
    })).toEqual({
      ...initialState,
      recipes: fixtureRecipes,
      recipeListNeedsFetch: false
    })
  })

  it('should handle SINGLE_RECIPE_RECEIVED', () => {
    expect(controlAppReducer(undefined, {
      type: actions.SINGLE_RECIPE_RECEIVED,
      recipe: fixtureRecipes[0]
    })).toEqual({
      ...initialState,
      recipes: [fixtureRecipes[0]],
      recipeListNeedsFetch: true,
      selectedRecipe: 1
    })
  })

  it('should handle SET_SELECTED_RECIPE', () => {
    expect(controlAppReducer(undefined, {
      type: actions.SET_SELECTED_RECIPE,
      recipeId: 2
    })).toEqual({
      ...initialState,
      selectedRecipe: 2
    })
  })

  it('should handle RECIPE_UPDATED', () => {
    expect(controlAppReducer({ recipes: fixtureRecipes }, {
      type: actions.RECIPE_UPDATED,
      recipe: {
        id: 3,
        name: "Updated recipe name",
        enabled: true
      }
    })).toEqual({
      recipes: [{
        "id": 1,
        "name": "Lorem Ipsum",
        "enabled": true
      },
      {
        "id": 2,
        "name": "Dolor set amet",
        "enabled": true
      },
      {
        id: 3,
        name: "Updated recipe name",
        enabled: true
      }]
    })
  })
});
