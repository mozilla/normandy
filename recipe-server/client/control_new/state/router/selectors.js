/* eslint import/prefer-default-export: "off" */
/**
 * Get a named parameter for the current route.
 * @param {Object} state
 * @param {String} paramName
 */
export function getRouterParam(state, paramName) {
  return state.router.params[paramName];
}
