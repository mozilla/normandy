import faker from 'faker';
import { Map } from 'immutable';

import { AutoIncrementField, Factory, Field } from 'control/tests/factory';


export const INITIAL_STATE = {
  items: new Map(),
};


export class ActionFactory extends Factory {
  getFields() {
    return {
      id: new AutoIncrementField(),
      argument_schema: {},
      implementation_url: new Field(faker.internet.url),
      name: new Field(faker.lorem.slug),
    };
  }
}
