export const fixtureRecipes = [
  { id: 1, name: 'Lorem Ipsum', enabled: true, revision_id: 'abc' },
  { id: 2, name: 'Dolor set amet', enabled: true, revision_id: 'def' },
  { id: 3, name: 'Consequitar adipscing', enabled: false, revision_id: 'ghi' },
];

export const fixtureStoredSingleRevision = {
  1: {
    abc: {
      id: 1,
      name: 'Lorem Ipsum',
      enabled: true,
      revision_id: 'abc',
    },
  },
};

export const fixtureSingleRevision = {
  id: 1,
  name: 'Lorem Ipsum',
  enabled: true,
  revision_id: 'abc',
};

export const fixtureStoredRevisions = {
  1: {
    abc: {
      id: 1,
      name: 'Lorem Ipsum',
      enabled: true,
      revision_id: 'abc',
    },
  },
  2: {
    def: {
      id: 2,
      name: 'Dolor set amet',
      enabled: true,
      revision_id: 'def',
    },
  },
  3: {
    ghi: {
      id: 3,
      name: 'Consequitar adipscing',
      enabled: false,
      revision_id: 'ghi',
    },
  },
};

export const initialState = {
  controlApp: {
    isFetching: false,
  },
  recipes: {
    list: [],
    revisions: {},
    selectedRecipe: null,
    recipeListNeedsFetch: true,
  },
  columns: [{
    label: 'Name',
    slug: 'name',
    enabled: true,
  }, {
    label: 'Action',
    slug: 'action',
    enabled: true,
  }, {
    label: 'Enabled',
    slug: 'enabled',
    enabled: true,
  }, {
    label: 'Channels',
    slug: 'channels',
  }, {
    label: 'Locales',
    slug: 'locales',
  }, {
    label: 'Countries',
    slug: 'countries',
  }, {
    label: 'Start Time',
    slug: 'startTime',
  }, {
    label: 'End Time',
    slug: 'endTime',
  }, {
    label: 'Additional Filters',
    slug: 'additionalFilter',
  }, {
    label: 'Last Updated',
    slug: 'last_updated',
    enabled: true,
  }, {
    label: 'Metadata',
    slug: 'metadata',
    enabled: true,
  }],
  notifications: [],
  user: {},
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
