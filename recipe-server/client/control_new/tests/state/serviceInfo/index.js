import { Map } from 'immutable';

import { Factory, SubFactory } from 'control_new/tests/factory';
import { UserFactory } from 'control_new/tests/state/users';


export const INITIAL_STATE = new Map();


export class ServiceInfoFactory extends Factory {
  getFields() {
    return {
      user: new SubFactory(UserFactory),
      peer_approval_enforced: true,
      logout_url: '/logout/',
    };
  }
}
