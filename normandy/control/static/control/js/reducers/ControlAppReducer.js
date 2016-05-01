let initialState = {
  recipes: null,
  isFetching: false,
  selectedRecipe: null,
  recipeListNeedsFetch: true
};

export function controlAppReducer(state = initialState, action) {
  switch (action.type) {
    default:
      return state;
  }
}

export default controlAppReducer;
