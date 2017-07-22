import faker from 'faker';
import { Map } from 'immutable';

import { AutoIncrementField, DateField, Factory, SubFactory } from 'control_new/tests/factory';
import { UserFactory } from 'control_new/tests/state';


export const INITIAL_STATE = {
  items: new Map(),
};


export class ApprovalRequestFactory extends Factory {
  getFields() {
    return {
      id: new AutoIncrementField(),
      approved: null,
      approver: null,
      comment: null,
      created: new DateField(),
      creator: new SubFactory(UserFactory),
    };
  }

  postGeneration() {
    const { isApproved, isRejected } = this.options;

    if (isApproved || isRejected) {
      this.data.approved = Boolean(isApproved);
      this.data.approver = UserFactory.build();
      this.data.comment = faker.lorem.sentence();
    }
  }
}
