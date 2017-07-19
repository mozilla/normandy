import { Map } from 'immutable';

import Factory from 'control_new/tests/factory';
import { RECIPE_SCHEMA } from 'control_new/tests/schemas';


export const INITIAL_STATE = {
  filters: new Map(),
  history: new Map(),
  items: new Map(),
  listing: new Map(),
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


export class RecipeFactory extends Factory {
  constructor(defaults = {}) {
    super(RECIPE_SCHEMA, defaults);
  }

  postGeneration() {
    if (!this.is_approved) {
      this.approved_revision = null;
      this.enabled = false;
    }
  }
}
