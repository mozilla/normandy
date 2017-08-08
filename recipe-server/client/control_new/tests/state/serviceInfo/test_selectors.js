import { fromJS } from 'immutable';

import {
  SERVICE_INFO_RECEIVE,
  USER_RECEIVE,
} from 'control_new/state/action-types';
import {
  getCurrentUser,
  isPeerApprovalEnforced,
  getLogoutUrl,
} from 'control_new/state/app/serviceInfo/selectors';
import serviceInfoReducer from 'control_new/state/app/serviceInfo/reducers';
import usersReducer from 'control_new/state/app/users/reducers';
import {
  INITIAL_STATE,
} from 'control_new/tests/state';
import {
  ServiceInfoFactory,
} from 'control_new/tests/state/serviceInfo';


const serviceInfo = ServiceInfoFactory.build();

const STATE = {
  ...INITIAL_STATE,
  app: {
    ...INITIAL_STATE.app,
    serviceInfo: serviceInfoReducer(undefined, {
      type: SERVICE_INFO_RECEIVE,
      serviceInfo,
    }),
    users: usersReducer(undefined, {
      type: USER_RECEIVE,
      user: serviceInfo.user,
    }),
  },
};


describe('getCurrentUser', () => {
  it('should return the current user', () => {
    expect(getCurrentUser(STATE)).toEqual(fromJS(serviceInfo.user));
  });
});


describe('isPeerApprovalEnforced', () => {
  it('should return the correct value', () => {
    expect(isPeerApprovalEnforced(STATE)).toEqual(serviceInfo.peer_approval_enforced);
  });
});


describe('getLogoutUrl', () => {
  it('should return the correct value', () => {
    expect(getLogoutUrl(STATE)).toEqual(serviceInfo.logout_url);
  });
});
