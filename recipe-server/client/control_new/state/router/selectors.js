/**
 * Get a named parameter for the current route.
 * @param {Object} state
 * @param {String} paramName
 */
export function getRouterParam(state, key, defaultsTo) {
  return state.router.params[key] || defaultsTo;
}

export function getRouterParamAsInt(state, key, defaultsTo) {
  return parseInt(getRouterParam(state, key, defaultsTo), 10);
}

export function getQueryParam(state, key, defaultsTo) {
  return state.router.query[key] || defaultsTo;
}

export function getQueryParamAsInt(state, key, defaultsTo) {
  return parseInt(getQueryParam(state, key, defaultsTo), 10);
}

export function getCurrentURL(state, queryParams) {
  return {
    pathname: state.router.pathname,
    query: {
      ...state.router.query,
      ...queryParams,
    },
  };
}
