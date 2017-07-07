export function getCurrentUser(state, defaultsTo = null) {
  return state.app.serviceInfo.get('user', defaultsTo);
}

export function isPeerApprovalEnforced(state, defaultsTo = true) {
  return state.app.serviceInfo.get('peer_approval_enforced', defaultsTo);
}

export function getLogoutUrl(state, defaultsTo = null) {
  return state.app.serviceInfo.get('logout_url', defaultsTo);
}
