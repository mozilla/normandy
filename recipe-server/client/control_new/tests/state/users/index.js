import faker from 'faker';
import { Map } from 'immutable';

import { AutoIncrementField, Factory, Field } from 'control_new/tests/factory';


export const INITIAL_STATE = {
  items: new Map(),
};


export class UserFactory extends Factory {
  getFields() {
    return {
      id: new AutoIncrementField(),
      email: new Field(faker.internet.email),
      first_name: new Field(faker.name.firstName),
      last_name: new Field(faker.name.lastName),
    };
  }
}
