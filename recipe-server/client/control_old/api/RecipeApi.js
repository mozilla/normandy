export function fetchAllRecipes() {
  return {
    url: 'recipe/',
    settings: {
      method: 'GET',
    },
    errorNotification: 'Error fetching recipes.',
  };
}

export function fetchSingleRecipe({
  recipeId,
}) {
  return {
    url: `recipe/${recipeId}/`,
    settings: {
      method: 'GET',
    },
    errorNotification: 'Error fetching recipe.',
  };
}

export function fetchSingleRevision({
  revisionId,
}) {
  return {
    url: `recipe_version/${revisionId}/`,
    settings: {
      method: 'GET',
    },
    errorNotification: 'Error fetching recipe revision.',
  };
}

export function fetchRecipeHistory({
  recipeId,
}) {
  return {
    url: `recipe/${recipeId}/history/`,
    settings: {
      method: 'GET',
    },
    errorNotification: 'Error fetching recipe history.',
  };
}

export function addRecipe({
  recipe,
}) {
  return {
    url: 'recipe/',
    settings: {
      body: JSON.stringify(recipe),
      method: 'POST',
    },
  };
}

export function updateRecipe({
  recipeId,
  recipe,
}) {
  return {
    url: `recipe/${recipeId}/`,
    settings: {
      body: JSON.stringify(recipe),
      method: 'PATCH',
    },
  };
}

export function deleteRecipe({
  recipeId,
}) {
  return {
    url: `recipe/${recipeId}/`,
    settings: {
      method: 'DELETE',
    },
    successNotification: 'Recipe deleted.',
    errorNotification: 'Error deleting recipe.',
  };
}

export function openApprovalRequest({
  revisionId,
}) {
  return {
    url: `recipe_revision/${revisionId}/request_approval/`,
    settings: {
      method: 'POST',
      body: JSON.stringify({
        revisionId,
      }),
    },
    errorNotification: 'Error creating new approval request.',
  };
}

export function approveApprovalRequest({
  requestId,
  comment = '',
}) {
  return {
    url: `approval_request/${requestId}/approve/`,
    settings: {
      method: 'POST',
      body: JSON.stringify({
        comment,
      }),
    },
    errorNotification: 'Error approving recipe approval.',
  };
}

export function rejectApprovalRequest({
  requestId,
  comment = '',
}) {
  return {
    url: `approval_request/${requestId}/reject/`,
    settings: {
      method: 'POST',
      body: JSON.stringify({
        comment,
      }),
    },
    errorNotification: 'Error rejecting recipe approval.',
  };
}

export function closeApprovalRequest({
  requestId,
}) {
  return {
    url: `approval_request/${requestId}/close/`,
    settings: {
      method: 'POST',
    },
    errorNotification: 'Error closing recipe approval request.',
  };
}

export function enableRecipe(recipeInfo) {
  return {
    url: `recipe/${recipeInfo.recipeId}/enable/`,
    settings: {
      method: 'POST',
    },
    successNotification: 'Recipe enabled.',
    errorNotification: 'Error enabling recipe.',
  };
}

export function disableRecipe(recipeInfo) {
  return {
    url: `recipe/${recipeInfo.recipeId}/disable/`,
    settings: {
      method: 'POST',
    },
    successNotification: 'Recipe disabled.',
    errorNotification: 'Error disabling recipe.',
  };
}
