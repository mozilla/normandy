export const fixtureRecipes = [
  { id: 1, name: 'Lorem Ipsum', enabled: true },
  { id: 2, name: 'Dolor set amet', enabled: true },
  { id: 3, name: 'Consequitar adipscing', enabled: false },
];

export const fixtureRecipeDict = {};
fixtureRecipes.forEach(recipe => {
  fixtureRecipeDict[recipe.id] = { ...recipe };
});

export const initialState = {
  controlApp: {
    isFetching: false,
  },
  recipes: {
    entries: {},
    selectedRecipe: null,
    recipeListNeedsFetch: true,
  },
  columns: [{
    label: 'Name',
    value: 'name',
    enabled: true,
  }, {
    label: 'Action',
    value: 'action',
    enabled: true,
  }, {
    label: 'Enabled',
    value: 'enabled',
    enabled: true,
  }, {
    label: 'Channels',
    value: 'channels',
  }, {
    label: 'Locales',
    value: 'locales',
  }, {
    label: 'Countries',
    value: 'countries',
  }, {
    label: 'Start Time',
    value: 'startTime',
  }, {
    label: 'End Time',
    value: 'endTime',
  }, {
    label: 'Additional Filters',
    value: 'additionalFilter',
  }, {
    label: 'Last Updated',
    value: 'last_updated',
    enabled: true,
  }, {
    label: 'Metadata',
    value: 'metadata',
    enabled: true,
  }],
  filters: [],
  notifications: [],
  form: {},
  routing: {
    locationBeforeTransitions: null,
  },
};

export const fixtureRevisions = [
  {
    id: 169,
    date_created: '2016-05-13T17:20:35.698735Z',
    recipe: {
      id: 36,
      name: 'Consequestar',
      enabled: true,
      revision_id: 22,
      action_name: 'console-log',
      arguments: {
        message: 'hi there message here',
      },
      filter_expression: '()',
      approver: null,
      is_approved: false,
    },
  },
];
