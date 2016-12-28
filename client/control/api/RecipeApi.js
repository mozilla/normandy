export function fetchAllRecipes() {
  return {
    url: 'recipe/',
    settings: {
      method: 'GET',
    },
    errorNotification: 'Error fetching recipes.',
  };
}

export function fetchSingleRecipe(recipeInfo) {
  return {
    url: `recipe/${recipeInfo.recipeId}/`,
    settings: {
      method: 'GET',
    },
    errorNotification: 'Error fetching recipe.',
  };
}

export function fetchSingleRevision(recipeInfo) {
  return {
    url: `recipe_version/${recipeInfo.revisionId}/`,
    settings: {
      method: 'GET',
    },
    errorNotification: 'Error fetching recipe revision.',
  };
}

export function fetchRecipeHistory(recipeInfo) {
  return {
    url: `recipe/${recipeInfo.recipeId}/history/`,
    settings: {
      method: 'GET',
    },
    errorNotification: 'Error fetching recipe history.',
  };
}

export function addRecipe(recipeInfo) {
  return {
    url: 'recipe/',
    settings: {
      body: JSON.stringify(recipeInfo.recipe),
      method: 'POST',
    },
  };
}

export function updateRecipe(recipeInfo) {
  return {
    url: `recipe/${recipeInfo.recipeId}/`,
    settings: {
      body: JSON.stringify(recipeInfo.recipe),
      method: 'PATCH',
    },
  };
}

export function deleteRecipe(recipeInfo) {
  return {
    url: `recipe/${recipeInfo.recipeId}/`,
    settings: {
      method: 'DELETE',
    },
    successNotification: 'Recipe deleted.',
    errorNotification: 'Error deleting recipe.',
  };
}
