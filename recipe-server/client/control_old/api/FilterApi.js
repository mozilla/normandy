export function fetchFilters() {
  return {
    url: 'filters/',
    settings: {
      method: 'GET',
    },
    errorNotification: 'Error fetching filter options.',
  };
}

export function fetchFilteredRecipes(filterParams) {
  return {
    url: `recipe/?${filterParams}`,
    settings: {
      method: 'GET',
    },
    errorNotification: 'Error fetching filtered recipes.',
  };
}
