/* eslint import/prefer-default-export: "off" */
/**
 * Get a named parameter for the current route.
 * @param {Object} state
 * @param {String} paramName
 */
export function getRouterParam(state, paramName) {
  return state.router.params[paramName];
}

export function getQueryParam(state, key, defaultsTo) {
  return state.router.query[key] || defaultsTo;
}

export function getQueryParamAsInt(state, key, defaultsTo) {
  return parseInt(getQueryParam(state, key, defaultsTo));
}

export function getCurrentURL(state, queryParams) {
  return {
    pathname: state.router.pathname,
    query: {
      ...state.router.query,
      ...queryParams,
    },
  }
}
