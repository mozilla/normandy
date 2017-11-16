import { getUser } from 'control/state/app/users/selectors';


export function getCurrentUser(state, defaultsTo = null) {
  return getUser(state, state.app.serviceInfo.get('user_id'), defaultsTo);
}

export function isPeerApprovalEnforced(state) {
  return state.app.serviceInfo.get('peer_approval_enforced') !== false;
}

export function getLogoutUrl(state, defaultsTo = null) {
  return state.app.serviceInfo.get('logout_url', defaultsTo);
}

export function getGithubUrl(state, defaultsTo = null) {
  return state.app.serviceInfo.get('github_url', defaultsTo);
}

export function isExperimenterConfigured(state) {
  return !(state.app.serviceInfo.get('experimenter_api_url', null) === null);
}

export function getExperimenterAPIUrl(state, defaultsTo = null) {
  return state.app.serviceInfo.get('experimenter_api_url', defaultsTo);
}
