import faker from 'faker';
import { Map } from 'immutable';

import {
  AutoIncrementField,
  DateField,
  Factory,
  Field,
  SubFactory,
} from 'control_new/tests/factory';
import { ActionFactory } from 'control_new/tests/state/actions';
import { RevisionFactory } from 'control_new/tests/state/revisions';


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


export class SimpleRecipeFactory extends Factory {
  static fields = {
    id: new AutoIncrementField(),
    action: new SubFactory(ActionFactory),
    arguments: {},
    channels: [],
    countries: [],
    enabled: false,
    extra_filter_expression: 'true',
    filter_expression: 'true',
    is_approved: false,
    locales: [],
    last_updated: new DateField(),
    name: new Field(faker.lorem.slug),
  }

  postGeneration() {
    const options = this._options;

    this.is_approved = options.isEnabled || options.isApproved;
    this.enabled = options.isEnabled;

    if (typeof this.extraPostGeneration === 'function') {
      this.extraPostGeneration();
    }
  }
}


export class RecipeFactory extends SimpleRecipeFactory {
  static fields = {
    ...SimpleRecipeFactory.fields,
    approved_revision: null,
    latest_revision: null,
  }

  extraPostGeneration() {
    const options = this._options;

    if (options.isEnabled || options.isApproved) {
      if (!this.approved_revision) {
        this.approved_revision = new RevisionFactory({
          recipe: SimpleRecipeFactory(this),
        });
      }

      if (!this.latest_revision) {
        this.latest_revision = new RevisionFactory(this.approved_revision);
      }
    } else if (!this.latest_revision) {
      this.latest_revision = new RevisionFactory({
        recipe: SimpleRecipeFactory(this),
      });
    }
  }
}
