import { fromJS } from 'immutable';

import {
  SERVICE_INFO_RECEIVE,
  USER_RECEIVE,
} from 'control/state/action-types';
import {
  isExperimenterConfigured,
  getCurrentUser,
  getExperimenterAPIUrl,
  getLogoutUrl,
  isPeerApprovalEnforced,
} from 'control/state/app/serviceInfo/selectors';
import serviceInfoReducer from 'control/state/app/serviceInfo/reducers';
import usersReducer from 'control/state/app/users/reducers';
import {
  INITIAL_STATE,
} from 'control/tests/state';
import {
  ServiceInfoFactory,
} from 'control/tests/state/serviceInfo';


const serviceInfo = ServiceInfoFactory.build();

function getTestState() {
  return {
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
}

const STATE = getTestState();


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


describe('isExperimenterConfigured', () => {
  it('should return false when experimenter api url is null', () => {
    const state = getTestState();
    state.app.serviceInfo = state.app.serviceInfo.set('experimenter_api_url', null);
    expect(isExperimenterConfigured(state)).toBeFalsy();
  });

  it('should return true when experimenter api url is not null', () => {
    expect(isExperimenterConfigured(STATE)).toBeTruthy();
  });
});


describe('getExperimenterAPIUrl', () => {
  it('should return the correct value', () => {
    expect(getExperimenterAPIUrl(STATE)).toEqual(serviceInfo.experimenter_api_url);
  });
});
