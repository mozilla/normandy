import { Map } from 'immutable';

import Factory from 'control_new/tests/factory';
import { APPROVAL_REQUEST_SCHEMA } from 'control_new/tests/schemas';


export const INITIAL_STATE = {
  items: new Map(),
};


export class ApprovalRequestFactory extends Factory {
  constructor(defaults = {}) {
    super(APPROVAL_REQUEST_SCHEMA, defaults);
  }

  postGeneration() {
    if (!this.approved) {
      this.approver = null;
    }
  }
}
