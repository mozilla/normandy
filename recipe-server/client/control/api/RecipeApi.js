export function fetchAllRecipes() {
  return {
    url: 'recipe/',
    settings: {
      method: 'GET',
    },
    errorNotification: 'Error fetching recipes.',
  };
}

export function fetchSingleRecipe({ recipeId }) {
  return {
    url: `recipe/${recipeId}/`,
    settings: {
      method: 'GET',
    },
    errorNotification: 'Error fetching recipe.',
  };
}

export function fetchSingleRevision({ revisionId }) {
  return {
    url: `recipe_version/${revisionId}/`,
    settings: {
      method: 'GET',
    },
    errorNotification: 'Error fetching recipe revision.',
  };
}

export function fetchRecipeHistory({ recipeId }) {
  return {
    url: `recipe/${recipeId}/history/`,
    settings: {
      method: 'GET',
    },
    errorNotification: 'Error fetching recipe history.',
  };
}

export function addRecipe({ recipe }) {
  return {
    url: 'recipe/',
    settings: {
      body: JSON.stringify(recipe),
      method: 'POST',
    },
  };
}

export function updateRecipe({ recipeId, recipe }) {
  return {
    url: `recipe/${recipeId}/`,
    settings: {
      body: JSON.stringify(recipe),
      method: 'PATCH',
    },
  };
}

export function deleteRecipe({ recipeId }) {
  return {
    url: `recipe/${recipeId}/`,
    settings: {
      method: 'DELETE',
    },
    successNotification: 'Recipe deleted.',
    errorNotification: 'Error deleting recipe.',
  };
}
