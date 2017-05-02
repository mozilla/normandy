import { Map } from 'immutable';


export const INITIAL_STATE = {
  filters: new Map(),
  history: new Map(),
  items: new Map(),
};


export const RECIPE = {
  id: 1,
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
