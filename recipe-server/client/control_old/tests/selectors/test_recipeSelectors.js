import * as recipeSelectors from 'control_old/selectors/RecipesSelector';

describe('Recipe Selectors', () => {
  describe('getRecipesList', () => {
    it('should return an array of loaded recipes', () => {
      const testState = {
        entries: {
          1: { id: 1 },
          2: { id: 2 },
          3: { id: 3 },
        },
      };

      const expectedList = [{ id: 1 }, { id: 2 }, { id: 3 }];
      expect(recipeSelectors.getRecipesList(testState)).toEqual(expectedList);
    });
  });

  describe('getSelectedRecipe', () => {
    it('should return the selected recipe object', () => {
      const testState = {
        entries: {
          1: { id: 1 },
          2: { id: 2 },
          3: { id: 3 },
        },
        selectedRecipe: 2,
      };

      expect(recipeSelectors.getSelectedRecipe(testState)).toEqual({ id: 2 });
    });
  });
});
