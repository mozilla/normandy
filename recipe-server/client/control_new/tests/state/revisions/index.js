import faker from 'faker';
import { Map } from 'immutable';
import { randexp } from 'randexp';

import { DateField, Factory, Field, SubFactory } from 'control_new/tests/factory';
import { UserFactory } from 'control_new/tests/state';
import { SimpleRecipeFactory } from 'control_new/tests/state/recipes';


export const INITIAL_STATE = {
  items: new Map(),
};


export class RevisionFactory extends Factory {
  static fields = {
    id: new Field(randexp, /[0-9a-f]{64}/),
    approval_request: null,
    comment: new Field(faker.lorem.sentence),
    date_created: new DateField(),
    recipe: new SubFactory(SimpleRecipeFactory),
    user: new SubFactory(UserFactory),
  }
}
