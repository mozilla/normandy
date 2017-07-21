import faker from 'faker';
import { Map } from 'immutable';

import { AutoIncrementField, Factory, Field } from 'control_new/tests/factory';


export const INITIAL_STATE = {
  items: new Map(),
  listing: new Map(),
};


export class ExtensionFactory extends Factory {
  static fields = {
    id: new AutoIncrementField(),
    name: new Field(faker.lorem.slug),
    xpi: new Field(faker.internet.url),
  };
}

