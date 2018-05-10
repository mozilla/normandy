import faker from 'faker';
import { Map } from 'immutable';

import {
  AutoIncrementField,
  DateField,
  Factory,
  Field,
  SubFactory,
} from 'control/tests/factory';
import { ActionFactory } from 'control/tests/state/actions';
import { RevisionFactory } from 'control/tests/state/revisions';


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
  getFields() {
    return {
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
    };
  }

  postGeneration() {
    const { isApproved, isEnabled } = this.options;

    this.data.is_approved = !!(isEnabled || isApproved);
    this.data.enabled = !!isEnabled;
  }
}


export class RecipeFactory extends SimpleRecipeFactory {
  getFields() {
    return {
      ...super.getFields(),
      approved_revision: null,
      latest_revision: null,
    };
  }

  postGeneration() {
    super.postGeneration();

    const { isApproved, isEnabled } = this.options;

    if (isEnabled || isApproved) {
      if (this.data.approved_revision) {
        this.data.approved_revision = RevisionFactory.build({
          recipe: SimpleRecipeFactory.build(this.data),
        });
      }

      if (this.data.latest_revision === null) {
        this.data.latest_revision = RevisionFactory.build(this.data.approved_revision);
      }
    }

    if (this.data.latest_revision === null) {
      this.data.latest_revision = RevisionFactory.build({
        recipe: SimpleRecipeFactory.build(this.data),
      });
    }
  }
}
