import { Map } from 'immutable';


export const INITIAL_STATE = {
  filters: new Map(),
  history: new Map(),
  items: new Map(),
};


export const RECIPE = {
  id: 1,
  action: {
    id: 1,
    name: 'test-action',
  },
  latest_revision: {
    id: '9f86d081',
    recipe: {
      id: 1,
    },
  },
  approved_revision: null,
};

export const FILTERS = {
  status: [
    {
      key: 'enabled',
      value: 'Enabled',
    },
    {
      key: 'disabled',
      value: 'Disabled',
    },
  ],
};
