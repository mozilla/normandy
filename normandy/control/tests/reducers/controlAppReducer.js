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
});
