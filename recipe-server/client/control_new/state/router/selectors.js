export function getUrlParam(state, name, defaultsTo) {
  return state.router.params[name] || defaultsTo;
}

export function getUrlParamAsInt(state, name, defaultsTo) {
  return parseInt(getUrlParam(state, name, defaultsTo), 10);
}
