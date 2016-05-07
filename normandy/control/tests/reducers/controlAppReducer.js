import controlAppReducer from '../../static/control/js/reducers/ControlAppReducer';

const initialState = {
  recipes: null,
  isFetching: false,
  selectedRecipe: null,
  recipeListNeedsFetch: true
};

describe('controlApp reducer', () => {
  it('should return initial state by default', () => {
    expect(controlAppReducer(undefined, {})).toEqual(initialState);
  })
});
