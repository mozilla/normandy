/* eslint import/prefer-default-export: "off" */
/**
 * Get a named parameter for the current route.
 * @param {Object} state
 * @param {String} paramName
 */
export function getRouterParam(state, paramName) {
  return state.router.params[paramName];
}

export function getQueryParameter(state, key, defaultsTo) {
  return state.router.query[key] || defaultsTo;
}

export function getCurrentURL(state, queryParams) {
  const query = {
    ...state.router.query,
    ...queryParams,
  };

  let queryString = '';
  Object.keys(query).forEach(key => {
    if (query[key]) {
      queryString += queryString ? '&' : '?';
      queryString += `${key}=${query[key]}`;
    }
  });

  return `${state.router.pathname}${queryString}`;
}
