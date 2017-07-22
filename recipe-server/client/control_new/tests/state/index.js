import faker from 'faker';

import { AutoIncrementField, Factory, Field } from 'control_new/tests/factory';
import { INITIAL_STATE as actions } from 'control_new/tests/state/actions';
import { INITIAL_STATE as approvalRequests } from 'control_new/tests/state/approvalRequests';
import { INITIAL_STATE as extensions } from 'control_new/tests/state/extensions';
import { INITIAL_STATE as recipes } from 'control_new/tests/state/recipes';
import { INITIAL_STATE as requests } from 'control_new/tests/state/requests';
import { INITIAL_STATE as revisions } from 'control_new/tests/state/revisions';


export const INITIAL_STATE = {
  app: {
    actions,
    approvalRequests,
    extensions,
    recipes,
    requests,
    revisions,
  },
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
