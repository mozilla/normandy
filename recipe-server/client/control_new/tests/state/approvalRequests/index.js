import faker from 'faker';
import { Map } from 'immutable';

import { AutoIncrementField, DateField, Factory, SubFactory } from 'control_new/tests/factory';
import { UserFactory } from 'control_new/tests/state';


export const INITIAL_STATE = {
  items: new Map(),
};


export class ApprovalRequestFactory extends Factory {
  static fields = {
    id: new AutoIncrementField(),
    approved: null,
    approver: null,
    comment: null,
    created: new DateField(),
    creator: new SubFactory(UserFactory),
  };

  postGeneration() {
    const options = this._options;

    if (options.isApproved || options.isRejected) {
      this.approved = Boolean(options.isApproved);
      this.approver = new UserFactory();
      this.comment = faker.lorem.sentence();
    }
  }
}
