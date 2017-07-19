import Factory from 'control_new/tests/factory';
import { USER_SCHEMA } from 'control_new/tests/schemas';

import { INITIAL_STATE as actions } from './actions';
import { INITIAL_STATE as approvalRequests } from './approvalRequests';
import { INITIAL_STATE as extensions } from './extensions';
import { INITIAL_STATE as recipes } from './recipes';
import { INITIAL_STATE as requests } from './requests';
import { INITIAL_STATE as revisions } from './revisions';


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
  constructor(defaults = {}) {
    super(USER_SCHEMA, defaults);
  }
}
